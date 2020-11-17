import * as vscode from "vscode";

import ActiveConnection from "./activeConnection";
import AutoComplete from "./autoComplete";
import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainType from "./blockchainType";
import BlockchainsTreeDataProvider from "./viewProviders/blockchainsTreeDataProvider";
import ContractDetector from "./detectors/contractDetector";
import NeoCommands from "./neoCommands";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./neoExpress/neoExpressCommands";
import NeoExpressDetector from "./detectors/neoExpressDetector";
import NeoExpressInstanceManager from "./neoExpress/neoExpressInstanceManager";
import NeoInvokeFileEditor from "./editors/neoInvokeFileEditor";
import QuickStartViewProvider from "./viewProviders/quickStartViewProvider";
import ServerListDetector from "./detectors/serverListDetector";
import TrackerCommands from "./trackerCommands";
import WalletDetector from "./detectors/walletDetector";

function registerBlockchainInstanceCommand(
  context: vscode.ExtensionContext,
  blockchainType: BlockchainType | undefined,
  blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
  commandId: string,
  handler: (identifier: BlockchainIdentifier) => Promise<void>
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      commandId,
      async (identifier?: BlockchainIdentifier) => {
        if (!identifier) {
          identifier = await blockchainsTreeDataProvider.select(blockchainType);
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
  const walletDetector = new WalletDetector();
  const neoExpress = new NeoExpress(context);
  const serverListDetector = new ServerListDetector(context.extensionPath);
  const neoExpressDetector = new NeoExpressDetector(context.extensionPath);
  const blockchainsTreeDataProvider = await BlockchainsTreeDataProvider.create(
    neoExpressDetector,
    serverListDetector
  );
  const activeConnection = new ActiveConnection(blockchainsTreeDataProvider);
  const neoExpressInstanceManager = new NeoExpressInstanceManager(
    neoExpress,
    activeConnection
  );
  const autoComplete = new AutoComplete(
    neoExpress,
    activeConnection,
    contractDetector,
    walletDetector
  );
  const neoInvokeFileEditor = new NeoInvokeFileEditor(
    context,
    activeConnection,
    neoExpress,
    autoComplete
  );

  context.subscriptions.push(activeConnection);
  context.subscriptions.push(autoComplete);
  context.subscriptions.push(contractDetector);
  context.subscriptions.push(neoExpressDetector);
  context.subscriptions.push(neoExpressInstanceManager);
  context.subscriptions.push(serverListDetector);
  context.subscriptions.push(walletDetector);

  context.subscriptions.push(
    vscode.window.registerTreeDataProvider(
      "neo3-visual-devtracker.views.blockchains",
      blockchainsTreeDataProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "neo3-visual-devtracker.express.neo-invoke-json",
      neoInvokeFileEditor
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "neo3-visual-devtracker.views.quickStart",
      new QuickStartViewProvider(
        context,
        blockchainsTreeDataProvider,
        neoExpressInstanceManager,
        contractDetector
      )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.express.create",
      () =>
        NeoExpressCommands.create(
          context,
          neoExpress,
          neoExpressInstanceManager
        )
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.neo.newContract",
      () => NeoCommands.newContract(context)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.neo.walletCreate",
      () => NeoCommands.createWallet()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("neo3-visual-devtracker.connect", () =>
      activeConnection.connect()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "neo3-visual-devtracker.customizeServerList",
      () => serverListDetector.customize()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("neo3-visual-devtracker.disconnect", () =>
      activeConnection.disconnect()
    )
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsTreeDataProvider,
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
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.express.customCommand",
    (identifier) => NeoExpressCommands.customCommand(neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.express.reset",
    (identifier) =>
      NeoExpressCommands.reset(
        neoExpress,
        identifier,
        neoExpressInstanceManager
      )
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.express.run",
    (identifier) => neoExpressInstanceManager.run(identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.express.transfer",
    (identifier) => NeoExpressCommands.transfer(neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    "express",
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.express.walletCreate",
    (identifier) => NeoExpressCommands.walletCreate(neoExpress, identifier)
  );

  registerBlockchainInstanceCommand(
    context,
    undefined,
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.neo.contractDeploy",
    (identifier) =>
      NeoCommands.contractDeploy(identifier, contractDetector, walletDetector)
  );

  registerBlockchainInstanceCommand(
    context,
    undefined,
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.tracker.openTracker",
    (identifier) => TrackerCommands.openTracker(context, identifier)
  );
}

export function deactivate() {}
