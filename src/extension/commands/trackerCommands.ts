import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import BlockchainIdentifier from "../blockchainIdentifier";
import BlockchainMonitorPool from "../blockchainMonitor/blockchainMonitorPool";
import TrackerPanelController from "../panelControllers/trackerPanelController";

export default class TrackerCommands {
  static async openTracker(
    context: vscode.ExtensionContext,
    identifer: BlockchainIdentifier,
    autoComplete: AutoComplete,
    blockchainMonitorPool: BlockchainMonitorPool
  ) {
    const rpcUrl = await identifer.selectRpcUrl();
    if (rpcUrl) {
      new TrackerPanelController(
        context,
        rpcUrl,
        autoComplete,
        blockchainMonitorPool
      );
    }
  }
}
