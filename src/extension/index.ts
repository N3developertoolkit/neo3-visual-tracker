import * as vscode from "vscode";

import ActiveConnection from "./activeConnection";
import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainType from "./blockchainType";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import ContractDetector from "./detectors/contractDetector";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import NeoExpressDetector from "./detectors/neoExpressDetector";
import NeoInvokeFileEditor from "./editors/neoInvokeFileEditor";
import ServerListDetector from "./detectors/serverListDetector";
import TrackerCommands from "./trackerCommands";
import WalletDetector from "./detectors/walletDetector";

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
  const contractDetector = new ContractDetector();
  const serverListDetector = new ServerListDetector(context.extensionPath);
  const neoExpressDetector = new NeoExpressDetector(context.extensionPath);
  const walletDetector = new WalletDetector();
  const blockchainsExplorer = await BlockchainsExplorer.create(
    neoExpressDetector,
    serverListDetector
  );
  const activeConnection = new ActiveConnection(blockchainsExplorer);
  const neoExpress = new NeoExpress(context);
  const neoInvokeFileEditor = new NeoInvokeFileEditor(
    context,
    activeConnection,
    neoExpress,
    contractDetector
  );

  context.subscriptions.push(activeConnection);
  context.subscriptions.push(contractDetector);
  context.subscriptions.push(neoExpressDetector);
  context.subscriptions.push(serverListDetector);
  context.subscriptions.push(walletDetector);

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
      "neo3-visual-devtracker.customizeServerList",
      async () => await serverListDetector.customize()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.connect",
      async () => await activeConnection.connect()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.disconnect",
      async () => await activeConnection.disconnect()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.express.create",
      async () => {
        await NeoExpressCommands.create(context, neoExpress);
      }
    )
  );

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "neo3-visual-devtracker.express.neo-invoke-json",
      neoInvokeFileEditor
    )
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsExplorer,
    "neo3-visual-devtracker.express.contractDeploy",
    (identifier) =>
      NeoExpressCommands.contractDeploy(
        neoExpress,
        identifier,
        contractDetector
      )
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsExplorer,
    "neo3-visual-devtracker.express.reset",
    (identifier) => NeoExpressCommands.reset(neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsExplorer,
    "neo3-visual-devtracker.express.run",
    (identifier) => NeoExpressCommands.run(context, neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsExplorer,
    "neo3-visual-devtracker.express.transfer",
    (identifier) => NeoExpressCommands.transfer(neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsExplorer,
    "neo3-visual-devtracker.express.walletCreate",
    (identifier) => NeoExpressCommands.walletCreate(neoExpress, identifier)
  );
}

export function deactivate() {}
