import BlockchainIdentifier from "../views/blockchainIdentifier";
import NeoExpress from "./neoExpress";

export default class NeoExpressIo {
  static async getDeployedContracts(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "nxp3") {
      return;
    }
    const output = neoExpress.runSync(
      "contract",
      "list",
      "-i",
      identifer.configPath
    );
    if (output.isError) {
      throw Error(`List contract error: ${output.message}`);
    }
    try {
      // TODO: This is a hack. COnsider either:
      //       a) Update `nxp3 contract list` to return a JSON array, OR
      //       b) Call expresslistcontracts over RPC instead
      return `}\n${output.message.trim()}\n{`
        .split("}\n{")
        .filter((_) => !!_?.trim())
        .map((_) => JSON.parse("{" + _ + "}"));
    } catch (e) {
      throw Error(`List contract error: ${e.message}`);
    }
  }
}
