import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import fs from "fs";

import DetectorBase from "./detectorBase";

const LOG_PREFIX = "[ContractDetector]";
const SEARCH_PATTERN = "**/*.nef";

type ContractMap = {
  [contractHash: string]: {
    manifest: Partial<ContractManifestJson>;
    absolutePathToNef: string;
  };
};

export default class ContractDetector extends DetectorBase {
  contracts: ContractMap = {};

  constructor() {
    super(SEARCH_PATTERN);
  }

  async processFiles() {
    const newSnapshot: ContractMap = {};
    for (const absolutePathToNef of this.files) {
      const manifest = ContractDetector.tryGetManifest(absolutePathToNef);
      if (manifest?.abi?.hash) {
        const contractHash = manifest.abi.hash;
        newSnapshot[contractHash] = { manifest, absolutePathToNef };
      }
    }
    this.contracts = newSnapshot;
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
}
