import * as vscode from "vscode";

import BlockchainIdentifier from "./views/blockchainIdentifier";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import TrackerPanelController from "./panelControllers/trackerPanelController";

export async function activate(context: vscode.ExtensionContext) {
  const blockchainsExplorer = await BlockchainsExplorer.create();
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

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-tracker.nxp3.run",
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsExplorer.select("runnable");
          if (!identifier) {
            return;
          }
        }
        NeoExpressCommands.run(context, neoExpress, identifier);
      }
    )
  );
}

export function deactivate() {}
