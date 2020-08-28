import * as vscode from "vscode";

import BlockchainIdentifier from "../views/blockchainIdentifier";
import IoHelpers from "../ioHelpers";
import NeoExpress from "./neoExpress";

export default class NeoExpressCommands {
  static async create(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress
  ) {
    const nodeCount = await IoHelpers.multipleChoice(
      "Number of nodes in the new instance",
      "1",
      "4",
      "7"
    );
    if (!nodeCount) {
      return;
    }
    const configSavePath = await IoHelpers.pickSaveFile(
      "Create",
      "Neo Express Configurations",
      "neo-express",
      context.extensionUri
    );
    if (!configSavePath) {
      return;
    }
    const output = neoExpress.runSync(
      "create",
      "-c",
      nodeCount,
      "-o",
      configSavePath,
      "-f"
    );
    vscode.window.showInformationMessage(output);
  }

  static async run(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.context !== "runnable") {
      return;
    }
    const children = identifer.getChildren();
    if (children.length === 1) {
      NeoExpressCommands.run(context, neoExpress, children[0]);
    } else if (children.length > 1) {
      const selection = await IoHelpers.multipleChoice(
        "Select a node",
        ...children.map((_, i) => `${i} - ${_.name}`)
      );
      if (!selection) {
        return;
      }
      const selectedIndex = parseInt(selection);
      NeoExpressCommands.run(context, neoExpress, children[selectedIndex]);
    } else {
      neoExpress.runInTerminal(
        identifer.name,
        "run",
        `-i ${identifer.configPath}`,
        `${identifer.index}`
      );
    }
  }
}
