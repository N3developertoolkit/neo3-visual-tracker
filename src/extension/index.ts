import * as vscode from "vscode";

import BlockchainIdentifier from "./views/blockchainIdentifier";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import TrackerCommands from "./trackerCommands";

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
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.tracker.openTracker",
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsExplorer.select();
          if (!identifier) {
            return;
          }
        }
        await TrackerCommands.openTracker(context, identifier);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.nxp3.create",
      async () => {
        await NeoExpressCommands.create(context, neoExpress);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.nxp3.run",
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsExplorer.select("nxp3");
          if (!identifier) {
            return;
          }
        }
        await NeoExpressCommands.run(context, neoExpress, identifier);
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.nxp3.transfer",
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsExplorer.select("nxp3");
          if (!identifier) {
            return;
          }
        }
        await NeoExpressCommands.transfer(neoExpress, identifier);
      }
    )
  );
}

export function deactivate() {}
