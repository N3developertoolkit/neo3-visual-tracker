import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import BlockchainIdentifier from "../views/blockchainIdentifier";
import NeoExpress from "./neoExpress";

const LOG_PREFIX = "[NeoExpressIo]";

export default class NeoExpressIo {
  static async contractGet(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier,
    hashOrNefPath: string
  ): Promise<ContractManifestJson | null> {
    if (identifer.blockchainType !== "nxp3") {
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
      return JSON.parse(output.message) as ContractManifestJson;
    } catch (e) {
      throw Error(`Get contract error: ${e.message}`);
    }
  }

  static async contractList(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ): Promise<ContractManifestJson[]> {
    if (identifer.blockchainType !== "nxp3") {
      return [];
    }
    const output = neoExpress.runSync(
      "contract",
      "list",
      "-i",
      identifer.configPath
    );
    if (output.isError) {
      throw Error(`List contract invoke error: ${output.message}`);
    }
    try {
      // TODO: This is a hack. Consider either:
      //       a) Update `nxp3 contract list` to return a JSON array, OR
      //       b) Call expresslistcontracts over RPC instead
      return `}\n${output.message.trim()}\n{`
        .split("}\n{")
        .filter((_) => !!_?.trim())
        .map((_) => JSON.parse("{" + _ + "}") as ContractManifestJson);
    } catch (e) {
      throw Error(`List contract parse error: ${e.message}`);
    }
  }
}
