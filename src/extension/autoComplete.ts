import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import * as fs from "fs";
import * as path from "path";
import * as temp from "temp";
import * as vscode from "vscode";

import ActiveConnection from "./activeConnection";
import AutoCompleteData from "../shared/autoCompleteData";
import BlockchainIdentifier from "./blockchainIdentifier";
import ContractDetector from "./fileDetectors/contractDetector";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressIo from "./neoExpress/neoExpressIo";
import dedupeAndSort from "./util/dedupeAndSort";
import WalletDetector from "./fileDetectors/walletDetector";

const LOG_PREFIX = "[AutoComplete]";
const REFRESH_INTERVAL_MS = 1000 * 5;

export default class AutoComplete {
  onChange: vscode.Event<AutoCompleteData>;

  private readonly onChangeEmitter: vscode.EventEmitter<AutoCompleteData>;
  private readonly wellKnownNames: { [hash: string]: string[] };

  private disposed = false;
  private latestData: AutoCompleteData;

  private readonly wellKnownManifests: {
    [contractHash: string]: Partial<ContractManifestJson>;
  } = {};

  get data() {
    return this.latestData;
  }

  constructor(
    private readonly context: vscode.ExtensionContext,
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
    this.onChangeEmitter = new vscode.EventEmitter<AutoCompleteData>();
    this.onChange = this.onChangeEmitter.event;
    this.wellKnownNames = {};
    this.initializeWellKnownManifests();
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
    this.onChangeEmitter.dispose();
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
      const identifier = BlockchainIdentifier.fromNeoExpressConfig(
        this.context.extensionPath,
        tempFile.path
      );
      if (!identifier || result.isError) {
        console.error(
          LOG_PREFIX,
          "Could not create temporary neo-express instance, built-in contract manifests will be unavailable",
          identifier,
          result.message
        );
      } else {
        const wellKnownContracts = await NeoExpressIo.contractList(
          this.neoExpress,
          identifier
        );
        for (const wellKnownContractName of Object.keys(wellKnownContracts)) {
          const wellKnownContract = wellKnownContracts[wellKnownContractName];
          this.wellKnownNames[wellKnownContract.hash] = [
            wellKnownContractName,
            `#${wellKnownContractName}`,
          ];
          this.wellKnownManifests[wellKnownContract.hash] =
            wellKnownContract.manifest;
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
    } catch (e) {
      console.error(LOG_PREFIX, "Unexpected error", e.message);
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
      contractNames: { ...this.wellKnownNames },
      contractWellKnownNames: { ...this.wellKnownNames },
      wellKnownAddresses: {},
      addressNames: {},
    };

    for (const hash of Object.keys(this.wellKnownNames)) {
      const names = (this.wellKnownNames as any)[hash] as string[];
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
        let name: string | undefined = (manifest as any).name;
        if (name) {
          newData.contractHashes[name] = contractHash;
        }
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
        for (const deployedContract of Object.values(deployedContracts)) {
          newData.contractManifests[deployedContract.hash] =
            deployedContract.manifest;
        }
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          "Could not list neo-express contracts",
          connection.blockchainIdentifier.configPath,
          e.message
        );
      }
    }

    const changed = JSON.stringify(this.latestData) !== JSON.stringify(newData);

    this.latestData = newData;

    if (changed) {
      this.onChangeEmitter.fire(newData);
    }
  }
}
