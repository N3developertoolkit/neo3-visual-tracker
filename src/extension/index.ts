import * as vscode from "vscode";

import BlockchainIdentifier from "./views/blockchainIdentifier";
import BlockchainType from "./views/blockchainType";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import ContractDetector from "./detectors/contractDetector";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import NeoInvokeFileEditor from "./editors/neoInvokeFileEditor";
import ServerListDetector from "./detectors/serverListDetector";
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
  const contractDetector = new ContractDetector();
  const serverListDetector = new ServerListDetector();
  const neoExpress = new NeoExpress(context);
  const neoInvokeFileEditor = new NeoInvokeFileEditor(
    context,
    blockchainsExplorer,
    neoExpress,
    contractDetector
  );

  context.subscriptions.push(blockchainsExplorer);
  context.subscriptions.push(contractDetector);
  context.subscriptions.push(serverListDetector);

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

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "neo3-visual-devtracker.nxp3.neo-invoke-json",
      neoInvokeFileEditor
    )
  );

  registerBlockchainInstanceCommand(
    context,
    "nxp3",
    blockchainsExplorer,
    "neo3-visual-devtracker.nxp3.contractDeploy",
    (identifier) =>
      NeoExpressCommands.contractDeploy(
        neoExpress,
        identifier,
        contractDetector
      )
  );

  registerBlockchainInstanceCommand(
    context,
    "nxp3",
    blockchainsExplorer,
    "neo3-visual-devtracker.nxp3.reset",
    (identifier) => NeoExpressCommands.reset(neoExpress, identifier)
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

  registerBlockchainInstanceCommand(
    context,
    "nxp3",
    blockchainsExplorer,
    "neo3-visual-devtracker.nxp3.walletCreate",
    (identifier) => NeoExpressCommands.walletCreate(neoExpress, identifier)
  );
}

export function deactivate() {}
