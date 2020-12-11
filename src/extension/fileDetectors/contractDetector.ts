import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import fs from "fs";

import ActiveConnection from "../activeConnection";
import JSONC from "../util/JSONC";
import DetectorBase from "./detectorBase";

const LOG_PREFIX = "[ContractDetector]";
// Contract deployments can happen independently of the extension, so polling is required:
const REFRESH_INTERVAL_MS = 1000 * 30;
const SEARCH_PATTERN = "**/*.nef";

type ContractMap = {
  [contractHash: string]: {
    manifest: Partial<ContractManifestJson>;
    absolutePathToNef: string;
    deploymentRequired: boolean;
    deployed: boolean;
  };
};

export default class ContractDetector extends DetectorBase {
  contracts: ContractMap = {};

  constructor(private readonly activeConnection: ActiveConnection) {
    super(SEARCH_PATTERN);
    activeConnection.onChange(async () => {
      if (await this.processFiles()) {
        this.onChangeEmitter.fire();
      }
    });
    this.refreshLoop();
  }

  async processFiles() {
    let deploymentStatusChanged = false;
    const newSnapshot: ContractMap = {};
    for (const absolutePathToNef of this.files) {
      const manifest = ContractDetector.tryGetManifest(absolutePathToNef);
      const contractName = (manifest as any)?.name;
      if (!!contractName && manifest?.abi?.hash) {
        const contractHash = manifest.abi.hash;
        let deploymentRequired = false;
        let deployed = false;
        try {
          await this.activeConnection.connection?.rpcClient.getContractState(
            contractHash
          );
          deployed = true;
        } catch (e) {
          // TODO: Debug why this isn't behaving right on latest neo-express build
          // https://github.com/ngdseattle/neo3-visual-tracker/issues/18
          console.error(contractName, contractHash, e.message, e);
          if (`${e.message}`.toLowerCase().indexOf("unknown contract") !== -1) {
            deploymentRequired = true;
          } else {
            console.warn(
              LOG_PREFIX,
              "Could not query for contract",
              absolutePathToNef,
              "Error:",
              e.message
            );
          }
        }
        if (
          this.contracts[contractHash] &&
          (this.contracts[contractHash].deploymentRequired !==
            deploymentRequired ||
            this.contracts[contractHash].deployed !== deployed)
        ) {
          deploymentStatusChanged = true;
        }
        newSnapshot[contractHash] = {
          manifest,
          absolutePathToNef,
          deploymentRequired,
          deployed,
        };
      }
    }
    this.contracts = newSnapshot;
    return deploymentStatusChanged;
  }

  static tryGetManifest(fullPathToNef: string) {
    try {
      const fullPathToManifest = fullPathToNef.replace(
        /\.nef$/,
        ".manifest.json"
      );
      return JSONC.parse(
        fs.readFileSync(fullPathToManifest).toString()
      ) as Partial<ContractManifestJson>;
    } catch (e) {
      console.warn(LOG_PREFIX, "Error parsing", fullPathToNef, e.message);
      return undefined;
    }
  }

  private async refreshLoop() {
    if (this.isDisposed) {
      return;
    }
    try {
      if (await this.processFiles()) {
        this.onChangeEmitter.fire();
      }
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }
}
