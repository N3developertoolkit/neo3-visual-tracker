import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import IoHelpers from "./ioHelpers";
import TrackerPanelController from "./panelControllers/trackerPanelController";

export default class TrackerCommands {
  static async openTracker(
    context: vscode.ExtensionContext,
    identifer: BlockchainIdentifier
  ) {
    const children = identifer.getChildren();
    if (children.length === 1) {
        TrackerCommands.openTracker(context, children[0]);
    } else if (children.length > 1) {
      const selection = await IoHelpers.multipleChoice(
        "Select an RPC server",
        ...children.map((_, i) => `${i} - ${_.name}`)
      );
      if (!selection) {
        return;
      }
      const selectedIndex = parseInt(selection);
      TrackerCommands.openTracker(context, children[selectedIndex]);
    } else {
      new TrackerPanelController(context, identifer.rpcUrls[0]);
    }
  }
}
