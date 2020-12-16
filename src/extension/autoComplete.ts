import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import * as fs from "fs";
import * as temp from "temp";
import * as vscode from "vscode";

import ActiveConnection from "./activeConnection";
import AutoCompleteData from "../shared/autoCompleteData";
import BlockchainIdentifier from "./blockchainIdentifier";
import ContractDetector from "./fileDetectors/contractDetector";
import dedupeAndSort from "./util/dedupeAndSort";
import Log from "../shared/log";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressDetector from "./fileDetectors/neoExpressDetector";
import NeoExpressIo from "./neoExpress/neoExpressIo";
import WalletDetector from "./fileDetectors/walletDetector";

const LOG_PREFIX = "[AutoComplete]";

export default class AutoComplete {
  onChange: vscode.Event<AutoCompleteData>;

  private readonly onChangeEmitter: vscode.EventEmitter<AutoCompleteData>;
  private readonly wellKnownNames: { [hash: string]: string };

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
    private readonly walletDetector: WalletDetector,
    neoExpressDetector: NeoExpressDetector
  ) {
    this.latestData = {
      contractManifests: {},
      contractNames: {},
      contractPaths: {},
      wellKnownAddresses: {},
      addressNames: {},
    };
    this.onChangeEmitter = new vscode.EventEmitter<AutoCompleteData>();
    this.onChange = this.onChangeEmitter.event;
    this.wellKnownNames = {};
    this.initializeWellKnownManifests();
    activeConnection.onChange(async () => await this.update());
    contractDetector.onChange(async () => await this.update());
    walletDetector.onChange(async () => await this.update());
    neoExpressDetector.onChange(async () => await this.update());
    this.update();
  }

  dispose() {
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
        Log.error(
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
          this.wellKnownNames[wellKnownContract.hash] = wellKnownContractName;
          this.wellKnownManifests[wellKnownContract.hash] =
            wellKnownContract.manifest;
        }
      }
    } catch (e) {
      Log.error(
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

  private async update() {
    Log.log(LOG_PREFIX, "Computing updated AutoCompleteData...");

    const newData: AutoCompleteData = {
      contractManifests: { ...this.wellKnownManifests },
      contractPaths: {},
      contractNames: { ...this.wellKnownNames },
      wellKnownAddresses: {},
      addressNames: {},
    };

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

    const workspaceContracts = Object.values(this.contractDetector.contracts);
    for (const workspaceContract of workspaceContracts) {
      const manifest = workspaceContract.manifest;
      const contractName = (manifest as any)?.name;
      const contractPath = workspaceContract.absolutePathToNef;
      if (contractName) {
        newData.contractManifests[contractName] = manifest;
        newData.contractPaths[contractName] =
          newData.contractPaths[contractName] || [];
        newData.contractPaths[contractName].push(contractPath);
        newData.contractPaths[contractName] = dedupeAndSort(
          newData.contractPaths[contractName]
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
        for (const contractName of Object.keys(deployedContracts)) {
          const deployedContract = deployedContracts[contractName];
          const contractHash = deployedContract.hash;
          newData.contractManifests[contractHash] = deployedContract.manifest;
          newData.contractManifests[contractName] = deployedContract.manifest;
          newData.contractNames[contractHash] = contractName;
        }
      } catch (e) {
        Log.warn(
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
