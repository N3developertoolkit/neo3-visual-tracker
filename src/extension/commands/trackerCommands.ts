import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import BlockchainMonitorPool from "../blockchainMonitor/blockchainMonitorPool";
import BlockchainsTreeDataProvider from "../vscodeProviders/blockchainsTreeDataProvider";
import { CommandArguments } from "../commandArguments";
import TrackerPanelController from "../panelControllers/trackerPanelController";

export default class TrackerCommands {
  static async openTracker(
    context: vscode.ExtensionContext,
    autoComplete: AutoComplete,
    blockchainMonitorPool: BlockchainMonitorPool,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select());
    if (!identifier) {
      return;
    }
    const rpcUrl = await identifier.selectRpcUrl();
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
