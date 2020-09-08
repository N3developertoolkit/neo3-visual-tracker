import * as vscode from "vscode";

import BlockchainIdentifier from "./views/blockchainIdentifier";
import BlockchainType from "./views/blockchainType";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import TrackerCommands from "./trackerCommands";

function registerBlockchainInstanceCommand(
  context: vscode.ExtensionContext,
  blockchainType: BlockchainType | undefined,
  blockchainsExplorer: BlockchainsExplorer,
  commandId: string,
  handler: (identifier: BlockchainIdentifier) => Promise<void>
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      commandId,
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsExplorer.select(blockchainType);
          if (!identifier) {
            return;
          }
        }
        await handler(identifier);
      }
    )
  );
}

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

  registerBlockchainInstanceCommand(
    context,
    undefined,
    blockchainsExplorer,
    "neo3-visual-devtracker.tracker.openTracker",
    (identifier) => TrackerCommands.openTracker(context, identifier)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.nxp3.create",
      async () => {
        await NeoExpressCommands.create(context, neoExpress);
      }
    )
  );

  registerBlockchainInstanceCommand(
    context,
    "nxp3",
    blockchainsExplorer,
    "neo3-visual-devtracker.nxp3.run",
    (identifier) => NeoExpressCommands.run(context, neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "nxp3",
    blockchainsExplorer,
    "neo3-visual-devtracker.nxp3.transfer",
    (identifier) => NeoExpressCommands.transfer(neoExpress, identifier)
  );
}

export function deactivate() {}
