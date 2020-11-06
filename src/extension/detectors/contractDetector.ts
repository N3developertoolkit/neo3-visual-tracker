import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";
import fs from "fs";

import DetectorBase from "./detectorBase";

const LOG_PREFIX = "[ContractDetector]";
const SEARCH_PATTERN = "**/*.nef";

export default class ContractDetector extends DetectorBase {
  contracts: { [fullPathToNef: string]: Partial<ContractManifestJson> } = {};

  constructor() {
    super(SEARCH_PATTERN);
  }

  async processFiles() {
    const newSnapshot: {
      [fullPathToNef: string]: Partial<ContractManifestJson>;
    } = {};
    for (const fullPathToNef of this.files) {
      const manifest = ContractDetector.tryGetManifest(fullPathToNef);
      if (manifest) {
        newSnapshot[fullPathToNef] = manifest;
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
