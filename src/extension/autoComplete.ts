import * as fs from "fs";
import * as path from "path";
import * as temp from "temp";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import ActiveConnection from "./activeConnection";
import AutoCompleteData from "../shared/autoCompleteData";
import ContractDetector from "./fileDetectors/contractDetector";
import JSONC from "./util/JSONC";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressIo from "./neoExpress/neoExpressIo";
import dedupeAndSort from "./util/dedupeAndSort";
import WalletDetector from "./fileDetectors/walletDetector";

const LOG_PREFIX = "[AutoComplete]";
const REFRESH_INTERVAL_MS = 1000 * 5;
const WELL_KNOWN_NAMES = {
  "0x668e0c1f9d7b70a99dd9e06eadd4c784d641afbc": ["GAS", "#GAS"],
  "0xde5f57d430d3dece511cf975a8d37848cb9e0525": ["NEO", "#NEO"],
  "0x763afecf3ebba0a67568a2c8be06e8f068c62666": ["Designation", "#Designation"],
  "0x3c05b488bf4cf699d0631bf80190896ebbf38c3b": ["Oracle", "#Oracle"],
  "0xce06595079cd69583126dbfd1d2e25cca74cffe9": ["Policy", "#Policy"],
};

export default class AutoComplete {
  private disposed = false;
  private latestData: AutoCompleteData;

  private readonly wellKnownManifests: {
    [contractHash: string]: Partial<ContractManifestJson>;
  } = {};

  get data() {
    return this.latestData;
  }

  constructor(
    private readonly neoExpress: NeoExpress,
    private readonly activeConnection: ActiveConnection,
    private readonly contractDetector: ContractDetector,
    private readonly walletDetector: WalletDetector
  ) {
    this.latestData = {
      contractManifests: {},
      contractHashes: {},
      contractNames: {},
      contractWellKnownNames: {},
      contractPaths: {},
      wellKnownAddresses: {},
      addressNames: {},
    };
    this.refreshLoop();
    this.initializeWellKnownManifests();
  }

  dispose() {
    this.disposed = true;
  }

  private async initializeWellKnownManifests() {
    const tempFile = temp.openSync();
    try {
      fs.closeSync(tempFile.fd);
      fs.unlinkSync(tempFile.path);
      const result = this.neoExpress.runSync(
        "create",
        "-f",
        "-c",
        "1",
        tempFile.path
      );
      if (result.isError) {
        console.error(
          LOG_PREFIX,
          "Could not create temporary neo-express instance, built-in contract manifests will be unavailable",
          result.message
        );
      } else {
        for (const hash of Object.keys(WELL_KNOWN_NAMES)) {
          const contractQuery = this.neoExpress.runSync(
            "contract",
            "get",
            hash,
            "-i",
            tempFile.path
          );
          if (contractQuery.isError) {
            console.error(
              LOG_PREFIX,
              "Could not get manifest from neo-express for built-in contract",
              hash,
              result.message
            );
          } else {
            try {
              this.wellKnownManifests[hash] = JSONC.parse(
                contractQuery.message
              ) as Partial<ContractManifestJson>;
            } catch (e) {
              console.error(
                LOG_PREFIX,
                "Could not parse manifest from neo-express for built-in contract",
                hash,
                e.message
              );
            }
          }
        }
      }
    } catch (e) {
      console.error(
        LOG_PREFIX,
        "Unexpected error when retrieving manifests for built-in contracts",
        e.message
      );
    } finally {
      if (fs.existsSync(tempFile.path)) {
        fs.unlinkSync(tempFile.path);
      }
    }
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.periodicUpdate();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async periodicUpdate() {
    const workspaceContracts = { ...this.contractDetector.contracts };

    const newData: AutoCompleteData = {
      contractManifests: { ...this.wellKnownManifests },
      contractHashes: {},
      contractPaths: {},
      contractNames: { ...WELL_KNOWN_NAMES },
      contractWellKnownNames: { ...WELL_KNOWN_NAMES },
      wellKnownAddresses: {},
      addressNames: {},
    };

    for (const hash of Object.keys(WELL_KNOWN_NAMES)) {
      const names = (WELL_KNOWN_NAMES as any)[hash] as string[];
      for (const name of names) {
        newData.contractHashes[name] = hash;
      }
    }

    const wallets = [...this.walletDetector.wallets];
    for (const wallet of wallets) {
      for (const address of wallet.addresses) {
        newData.addressNames[address] = newData.addressNames[address] || [];
        newData.addressNames[address].push(wallet.path);
        newData.addressNames[address] = dedupeAndSort(
          newData.addressNames[address]
        );
      }
    }

    for (const workspaceContract of Object.values(workspaceContracts)) {
      const manifest = workspaceContract.manifest;
      const contractHash = manifest.abi?.hash;
      const contractPath = workspaceContract.absolutePathToNef;
      if (contractHash) {
        newData.contractManifests[contractHash] = manifest;
        newData.contractHashes[contractPath] = contractHash;
        newData.contractPaths[contractHash] =
          newData.contractPaths[contractHash] || [];
        newData.contractPaths[contractHash].push(contractPath);
        newData.contractPaths[contractHash] = dedupeAndSort(
          newData.contractPaths[contractHash]
        );
        newData.contractNames[contractHash] =
          newData.contractNames[contractHash] || [];
        newData.contractNames[contractHash].push(
          path.basename(contractPath).replace(/\.nef$/, "")
        );
        newData.contractNames[contractHash] = dedupeAndSort(
          newData.contractNames[contractHash]
        );
      }
    }

    const connection = this.activeConnection.connection;

    newData.wellKnownAddresses =
      connection?.blockchainIdentifier.getWalletAddresses() || {};

    for (const walletName of Object.keys(newData.wellKnownAddresses)) {
      const walletAddress = newData.wellKnownAddresses[walletName];
      newData.addressNames[walletAddress] =
        newData.addressNames[walletAddress] || [];
      newData.addressNames[walletAddress].push(walletName);
      newData.addressNames[walletAddress] = dedupeAndSort(
        newData.addressNames[walletAddress]
      );
    }

    if (connection?.blockchainIdentifier?.blockchainType === "express") {
      try {
        const deployedContracts = await NeoExpressIo.contractList(
          this.neoExpress,
          connection.blockchainIdentifier
        );
        for (const deployedContract of deployedContracts) {
          newData.contractManifests[
            deployedContract.abi.hash
          ] = deployedContract;
        }
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          "Could not list neo-express contracts",
          connection.blockchainIdentifier.configPath,
          e
        );
      }
    }

    this.latestData = newData;
  }
}
