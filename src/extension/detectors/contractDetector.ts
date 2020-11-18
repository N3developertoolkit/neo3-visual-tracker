import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import fs from "fs";

import ActiveConnection from "../activeConnection";
import DetectorBase from "./detectorBase";

const LOG_PREFIX = "[ContractDetector]";
const REFRESH_INTERVAL_MS = 1000 * 5;
const SEARCH_PATTERN = "**/*.nef";

type ContractMap = {
  [contractHash: string]: {
    manifest: Partial<ContractManifestJson>;
    absolutePathToNef: string;
    deploymentRequired: boolean;
  };
};

export default class ContractDetector extends DetectorBase {
  contracts: ContractMap = {};

  constructor(private readonly activeConnection: ActiveConnection) {
    super(SEARCH_PATTERN);
    this.refreshLoop();
  }

  async processFiles() {
    let deploymentStatusChanged = false;
    const newSnapshot: ContractMap = {};
    for (const absolutePathToNef of this.files) {
      const manifest = ContractDetector.tryGetManifest(absolutePathToNef);
      if (manifest?.abi?.hash) {
        const contractHash = manifest.abi.hash;
        let deploymentRequired = false;
        try {
          await this.activeConnection.connection?.rpcClient.getContractState(
            contractHash
          );
        } catch (e) {
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
          this.contracts[contractHash].deploymentRequired !== deploymentRequired
        ) {
          deploymentStatusChanged = true;
        }
        newSnapshot[contractHash] = {
          manifest,
          absolutePathToNef,
          deploymentRequired,
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
      return JSON.parse(
        fs.readFileSync(fullPathToManifest).toString()
      ) as Partial<ContractManifestJson>;
    } catch (e) {
      console.warn(LOG_PREFIX, "Error parsing", fullPathToNef, e.message);
      return undefined;
    }
  }

  private async refreshLoop() {
    // Contract deployments can happen independently of the extension, so
    // we poll for changes in deployment state:
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
