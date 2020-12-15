import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import fs from "fs";

import ActiveConnection from "../activeConnection";
import DetectorBase from "./detectorBase";
import JSONC from "../util/JSONC";

const LOG_PREFIX = "[ContractDetector]";
// Contract deployments can happen independently of the extension, so polling is required:
// TODO: Use a BlockchainMonitor on the active connection to be faster at detecting deployment
const REFRESH_INTERVAL_MS = 1000 * 15;
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
      const contractName: string = (manifest as any)?.name || "";
      if (manifest && contractName) {
        let deploymentRequired = false;
        let deployed = false;
        const connection = this.activeConnection.connection;
        if (connection) {
          try {
            // TODO: Replace with a call to an RPC method that also exists on TestNet/MainNet
            const result = (await connection.rpcClient.query({
              method: "expressgetcontractstate",
              params: [contractName],
              id: 0,
              jsonrpc: "2.0",
            })) as any[];
            if (result.length) {
              deployed = true;
            } else {
              deploymentRequired = true;
            }
          } catch (e) {
            console.warn(
              LOG_PREFIX,
              "Could not query for contract",
              contractName,
              absolutePathToNef,
              "Error:",
              e.message
            );
          }
        }
        if (
          this.contracts[contractName] &&
          (this.contracts[contractName].deploymentRequired !==
            deploymentRequired ||
            this.contracts[contractName].deployed !== deployed)
        ) {
          deploymentStatusChanged = true;
        }
        newSnapshot[contractName] = {
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
