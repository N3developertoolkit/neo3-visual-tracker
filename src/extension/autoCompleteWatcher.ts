import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import ActiveConnection from "./activeConnection";
import AutoCompleteData from "../shared/autoCompleteData";
import ContractDetector from "./detectors/contractDetector";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressIo from "./neoExpress/neoExpressIo";

const LOG_PREFIX = "[AutoCompleteWatcher]";
const REFRESH_INTERVAL_MS = 1000 * 5;

export default class AutoCompleteWatcher {
  private disposed = false;
  private latestData: AutoCompleteData;

  get data() {
    return this.latestData;
  }

  constructor(
    private readonly neoExpress: NeoExpress,
    private readonly activeConnection: ActiveConnection,
    private readonly contractDetector: ContractDetector
  ) {
    this.latestData = { addressSuggestions: [], contracts: {}, nefHints: {} };
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
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
    const connection = this.activeConnection.connection;

    const contracts: { [hashOrNefFile: string]: ContractManifestJson } = {};
    const nefHints: { [hash: string]: { [nefPath: string]: boolean } } = {};
    const addressSuggestions: string[] =
      connection?.blockchainIdentifier.walletAddresses || [];

    if (connection?.blockchainIdentifier?.blockchainType === "express") {
      try {
        const deployedContracts = await NeoExpressIo.contractList(
          this.neoExpress,
          connection.blockchainIdentifier
        );
        for (const deployedContract of deployedContracts) {
          contracts[deployedContract.abi.hash] = deployedContract;
        }
      } catch (e) {
        console.warn(
          LOG_PREFIX,
          "Could not list neo-express contracts",
          connection.blockchainIdentifier.configPath,
          e
        );
      }

      for (const nefFile of this.contractDetector.contracts) {
        try {
          const manifest = await NeoExpressIo.contractGet(
            this.neoExpress,
            connection.blockchainIdentifier,
            nefFile
          );
          if (manifest) {
            nefHints[manifest.abi.hash] = nefHints[manifest.abi.hash] || {};
            nefHints[manifest.abi.hash][nefFile] = true;
          }
        } catch (e) {
          console.warn(
            LOG_PREFIX,
            "Could not get neo-express contract",
            nefFile,
            connection.blockchainIdentifier.configPath,
            e
          );
        }
      }
    }
    this.latestData = { addressSuggestions, contracts, nefHints };
  }
}
