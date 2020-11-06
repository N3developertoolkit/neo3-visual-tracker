import * as vscode from "vscode";

import BlockchainIdentifier from "../blockchainIdentifier";
import IoHelpers from "../ioHelpers";
import NeoExpress from "./neoExpress";

export default class NeoExpressInstanceManager {
  dispose() {}

  async run(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const children = identifer.getChildren();
    if (children.length === 1) {
      this.run(context, neoExpress, children[0]);
    } else if (children.length > 1) {
      const selection = await IoHelpers.multipleChoice(
        "Select a node",
        ...children.map((_, i) => `${i} - ${_.name}`)
      );
      if (!selection) {
        return;
      }
      const selectedIndex = parseInt(selection);
      this.run(context, neoExpress, children[selectedIndex]);
    } else {
      neoExpress.runInTerminal(
        identifer.name,
        "run",
        "-i",
        identifer.configPath,
        "-s",
        "15",
        `${identifer.index}`
      );
    }
  }
}
