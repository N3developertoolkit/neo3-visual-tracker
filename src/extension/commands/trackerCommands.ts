import * as vscode from "vscode";

import BlockchainIdentifier from "../blockchainIdentifier";
import TrackerPanelController from "../panelControllers/trackerPanelController";

export default class TrackerCommands {
  static async openTracker(
    context: vscode.ExtensionContext,
    identifer: BlockchainIdentifier
  ) {
    const rpcUrl = await identifer.selectRpcUrl();
    if (rpcUrl) {
      new TrackerPanelController(context, rpcUrl);
    }
  }
}
