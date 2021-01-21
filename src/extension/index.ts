import * as vscode from "vscode";

import ActiveConnection from "./activeConnection";
import AutoComplete from "./autoComplete";
import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainMonitorPool from "./blockchainMonitor/blockchainMonitorPool";
import BlockchainType from "./blockchainType";
import BlockchainsTreeDataProvider from "./vscodeProviders/blockchainsTreeDataProvider";
import ContractDetector from "./fileDetectors/contractDetector";
import Log from "../shared/log";
import NeoCommands from "./commands/neoCommands";
import NeoExpress from "./neoExpress/neoExpress";
import NeoExpressCommands from "./commands/neoExpressCommands";
import NeoExpressDetector from "./fileDetectors/neoExpressDetector";
import NeoExpressInstanceManager from "./neoExpress/neoExpressInstanceManager";
import NeoInvokeFileEditorProvider from "./vscodeProviders/neoInvokeFileEditorProvider";
import QuickStartViewProvider from "./vscodeProviders/quickStartViewProvider";
import ServerListDetector from "./fileDetectors/serverListDetector";
import TrackerCommands from "./commands/trackerCommands";
import WalletDetector from "./fileDetectors/walletDetector";

const LOG_PREFIX = "index";

function registerBlockchainInstanceCommand(
  context: vscode.ExtensionContext,
  blockchainType: BlockchainType | undefined,
  blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
  commandId: string,
  handler: (identifier: BlockchainIdentifier, path?: string) => Promise<void>
) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      commandId,
      async (context?: BlockchainIdentifier | vscode.Uri) => {
        let identifier: BlockchainIdentifier | undefined = undefined;
        let path: string | undefined = undefined;
        if (context && (context as vscode.Uri).fsPath) {
          path = (context as vscode.Uri).fsPath;
        }
        if (context && (context as BlockchainIdentifier).blockchainType) {
          identifier = context as BlockchainIdentifier;
        }
        if (!identifier) {
          identifier = await blockchainsTreeDataProvider.select(blockchainType);
          if (!identifier) {
            return;
          }
        }
        await handler(identifier, path);
      }
    )
  );
}

export async function activate(context: vscode.ExtensionContext) {
  Log.log(LOG_PREFIX, "Activating extension...");
  const blockchainMonitorPool = new BlockchainMonitorPool();
  const walletDetector = new WalletDetector();
  const neoExpress = new NeoExpress(context);
  const serverListDetector = new ServerListDetector(context.extensionPath);
  const neoExpressDetector = new NeoExpressDetector(context.extensionPath);
  const blockchainsTreeDataProvider = await BlockchainsTreeDataProvider.create(
    neoExpressDetector,
    serverListDetector
  );
  const activeConnection = new ActiveConnection(
    blockchainsTreeDataProvider,
    blockchainMonitorPool
  );
  const contractDetector = new ContractDetector(activeConnection);
  const neoExpressInstanceManager = new NeoExpressInstanceManager(
    neoExpress,
    activeConnection
  );
  const autoComplete = new AutoComplete(
    context,
    neoExpress,
    activeConnection,
    contractDetector,
    walletDetector,
    neoExpressDetector
  );
  const neoInvokeFileEditorProvider = new NeoInvokeFileEditorProvider(
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
      "neo3-visual-devtracker.neo.neo-invoke-json",
      neoInvokeFileEditorProvider
    )
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "neo3-visual-devtracker.views.quickStart",
      new QuickStartViewProvider(
        context,
        blockchainsTreeDataProvider,
        neoExpressInstanceManager,
        contractDetector,
        activeConnection,
        walletDetector
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
          neoExpressInstanceManager,
          autoComplete,
          blockchainMonitorPool
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
    (identifier, nefPath) =>
      NeoExpressCommands.contractDeploy(
        neoExpress,
        identifier,
        contractDetector,
        nefPath
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
    "neo3-visual-devtracker.express.runAdvanced",
    (identifier) => neoExpressInstanceManager.runAdvanced(identifier)
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
    (identifier, nefPath) =>
      NeoCommands.contractDeploy(
        identifier,
        contractDetector,
        walletDetector,
        nefPath
      )
  );

  registerBlockchainInstanceCommand(
    context,
    undefined,
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.neo.invokeContract",
    (identifier) => NeoCommands.invokeContract(identifier, activeConnection)
  );

  registerBlockchainInstanceCommand(
    context,
    undefined,
    blockchainsTreeDataProvider,
    "neo3-visual-devtracker.tracker.openTracker",
    (identifier) =>
      TrackerCommands.openTracker(
        context,
        identifier,
        autoComplete,
        blockchainMonitorPool
      )
  );
}

export function deactivate() {
  Log.log(LOG_PREFIX, "Deactivating extension...");
}
