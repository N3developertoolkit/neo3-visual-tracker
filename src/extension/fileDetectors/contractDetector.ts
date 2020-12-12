import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import * as extractZip from "extract-zip";
import fs from "fs";
import * as temp from "temp";

import ActiveConnection from "../activeConnection";
import DetectorBase from "./detectorBase";
import JSONC from "../util/JSONC";
import posixPath from "../util/posixPath";

const LOG_PREFIX = "[ContractDetector]";
// Contract deployments can happen independently of the extension, so polling is required:
// TODO: Use a BlockchainMonitor on the active connection to be faster at detecting deployment
const REFRESH_INTERVAL_MS = 1000 * 5;
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
      const contractHash = await ContractDetector.tryGetHash(absolutePathToNef);
      if (manifest && contractHash) {
        let deploymentRequired = false;
        let deployed = false;
        const connection = this.activeConnection.connection;
        if (connection) {
          try {
            await connection.rpcClient.getContractState(contractHash);
            deployed = true;
          } catch (e) {
            if (
              `${e.message}`.toLowerCase().indexOf("unknown contract") !== -1
            ) {
              deploymentRequired = true;
            } else {
              console.warn(
                LOG_PREFIX,
                "Could not query for contract",
                contractHash,
                absolutePathToNef,
                "Error:",
                e.message
              );
            }
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

  // TODO: Figure out why the hash returned by this is different to that returned
  //       by nxp3 contract list
  static async tryGetHash(fullPathToNef: string): Promise<string> {
    try {
      const fullPathToZippedDebugJson = fullPathToNef.replace(
        /\.nef$/,
        ".nefdbgnfo"
      );
      const dir = temp.mkdirSync();
      await extractZip.default(fullPathToZippedDebugJson, { dir });
      const fullPathToDebugJson = posixPath(dir, fs.readdirSync(dir)[0]);
      return (
        JSONC.parse(fs.readFileSync(fullPathToDebugJson).toString()).hash || ""
      );
    } catch (e) {
      console.warn(
        LOG_PREFIX,
        "Error determining contract hash",
        fullPathToNef,
        e.message
      );
      return "";
    }
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
