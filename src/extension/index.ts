import * as vscode from "vscode";

import BlockchainsExplorer from "./views/blockchainsExplorer";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import TrackerPanelController from "./panelControllers/trackerPanelController";

export function activate(context: vscode.ExtensionContext) {
  const blockchainsExplorer = new BlockchainsExplorer();
  const neoExpress = new NeoExpress(context);

  context.subscriptions.push(blockchainsExplorer);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "neo3-visual-devtracker.blockchainsExplorer",
      blockchainsExplorer
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("neo3-visual-tracker.helloWorld", () => {
      new TrackerPanelController(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("neo3-visual-tracker.nxp3.create", () => {
      NeoExpressCommands.create(context, neoExpress);
    })
  );
}

export function deactivate() {}
