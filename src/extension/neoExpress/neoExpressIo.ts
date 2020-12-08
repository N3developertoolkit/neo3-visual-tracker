import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import BlockchainIdentifier from "../blockchainIdentifier";
import JSONC from "../util/JSONC";
import NeoExpress from "./neoExpress";

const LOG_PREFIX = "[NeoExpressIo]";

export default class NeoExpressIo {
  static async contractGet(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier,
    hashOrNefPath: string
  ): Promise<ContractManifestJson | null> {
    if (identifer.blockchainType !== "express") {
      return null;
    }
    const output = neoExpress.runSync(
      "contract",
      "get",
      hashOrNefPath,
      "-i",
      identifer.configPath
    );
    if (output.isError) {
      return null;
    }
    try {
      return JSONC.parse(output.message) as ContractManifestJson;
    } catch (e) {
      throw Error(`Get contract error: ${e.message}`);
    }
  }

  static async contractList(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ): Promise<ContractManifestJson[]> {
    if (identifer.blockchainType !== "express") {
      return [];
    }
    const output = neoExpress.runSync(
      "contract",
      "list",
      "-i",
      identifer.configPath,
      "--json"
    );
    if (output.isError) {
      console.error(LOG_PREFIX, "List contract invoke error", output.message);
      return [];
    }
    try {
      return JSONC.parse(output.message);
    } catch (e) {
      throw Error(`List contract parse error: ${e.message}`);
    }
  }
}
