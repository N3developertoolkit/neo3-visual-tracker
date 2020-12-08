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
  ): Promise<{
    [name: string]: { hash: string; manifest: ContractManifestJson };
  }> {
    if (identifer.blockchainType !== "express") {
      return {};
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
      return {};
    }
    try {
      let result: {
        [name: string]: { hash: string; manifest: ContractManifestJson };
      } = {};
      let contractSummaries = JSONC.parse(output.message);
      for (const contractSummary of contractSummaries) {
        const hash = contractSummary.hash;
        const manifest = await this.contractGet(neoExpress, identifer, hash);
        if (!manifest) {
          console.error(
            LOG_PREFIX,
            "Could not get manifest from neo-express",
            hash
          );
        } else {
          result[contractSummary.name] = { hash, manifest };
        }
      }
      return result;
    } catch (e) {
      throw Error(`List contract parse error: ${e.message}`);
    }
  }
}
