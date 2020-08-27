import * as vscode from "vscode";

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
}
