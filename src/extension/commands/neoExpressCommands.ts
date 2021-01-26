import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import BlockchainIdentifier from "../blockchainIdentifier";
import BlockchainMonitorPool from "../blockchainMonitor/blockchainMonitorPool";
import BlockchainsTreeDataProvider from "../vscodeProviders/blockchainsTreeDataProvider";
import { CommandArguments } from "../commandArguments";
import ContractDetector from "../fileDetectors/contractDetector";
import IoHelpers from "../util/ioHelpers";
import NeoExpress from "../neoExpress/neoExpress";
import NeoExpressInstanceManager from "../neoExpress/neoExpressInstanceManager";
import TrackerPanelController from "../panelControllers/trackerPanelController";

export default class NeoExpressCommands {
  static async contractDeploy(
    neoExpress: NeoExpress,
    contractDetector: ContractDetector,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select("express"));
    if (!identifier) {
      return;
    }
    if (!Object.keys(contractDetector.contracts).length) {
      vscode.window.showErrorMessage(
        "No compiled contracts were found in the current workspace. A compiled contract (*.nef file) along with its manifest (*.manifest.json file) is required for deployment."
      );
      return;
    }
    const walletNames = Object.keys(await identifier.getWalletAddresses());
    const account = await IoHelpers.multipleChoice(
      "Select an account...",
      ...walletNames
    );
    if (!account) {
      return;
    }
    const contractFile =
      commandArguments?.path ||
      (await IoHelpers.multipleChoiceFiles(
        `Use account "${account}" to deploy...`,
        ...Object.values(contractDetector.contracts).map(
          (_) => _.absolutePathToNef
        )
      ));
    if (!contractFile) {
      return;
    }
    const output = await neoExpress.run(
      "contract",
      "deploy",
      contractFile,
      account,
      "-i",
      identifier.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  static async create(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress,
    neoExpressInstanceManager: NeoExpressInstanceManager,
    autoComplete: AutoComplete,
    blockchainMonitorPool: BlockchainMonitorPool,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider
  ) {
    const nodeCount = await IoHelpers.multipleChoice(
      "Number of nodes in the new instance",
      "1",
      "4",
      "7"
    );
    if (!nodeCount) {
      return;
    }
    const configSavePath = await IoHelpers.pickSaveFile(
      "Create",
      "Neo Express Configurations",
      "neo-express",
      (vscode.workspace.workspaceFolders || [])[0]?.uri
    );
    if (!configSavePath) {
      return;
    }
    const output = await neoExpress.run(
      "create",
      "-f",
      "-c",
      nodeCount,
      configSavePath
    );
    NeoExpressCommands.showResult(output);
    if (!output.isError) {
      const blockchainIdentifier = await BlockchainIdentifier.fromNeoExpressConfig(
        context.extensionPath,
        configSavePath
      );
      if (blockchainIdentifier) {
        await neoExpressInstanceManager.run(blockchainsTreeDataProvider, {
          blockchainIdentifier,
        });
        const rpcUrl = await blockchainIdentifier.selectRpcUrl();
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
  }

  static async customCommand(
    neoExpress: NeoExpress,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select("express"));
    if (!identifier) {
      return;
    }
    const command = await IoHelpers.enterString("Enter a neo-express command");
    if (!command) {
      return;
    }
    const output = await neoExpress.runUnsafe(
      command,
      "-i",
      identifier.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  static async reset(
    neoExpress: NeoExpress,
    neoExpressInstanceManager: NeoExpressInstanceManager,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const blockchainIdentifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select("express"));
    if (!blockchainIdentifier) {
      return;
    }
    const confirmed = await IoHelpers.yesNo(
      `Are you sure that you want to reset "${blockchainIdentifier.configPath}"?`
    );
    if (!confirmed) {
      return;
    }
    const wasRunning =
      neoExpressInstanceManager.runningInstance?.configPath ===
      blockchainIdentifier.configPath;
    if (wasRunning) {
      await neoExpressInstanceManager.stop();
    }
    try {
      const output = await neoExpress.run(
        "reset",
        "-f",
        "-i",
        blockchainIdentifier.configPath
      );
      NeoExpressCommands.showResult(output);
    } finally {
      if (wasRunning) {
        await neoExpressInstanceManager.run(blockchainsTreeDataProvider, {
          blockchainIdentifier,
        });
      }
    }
  }

  static async transfer(
    neoExpress: NeoExpress,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select("express"));
    if (!identifier) {
      return;
    }
    const asset = await IoHelpers.multipleChoice(
      "Select an asset",
      "NEO",
      "GAS"
    );
    if (!asset) {
      return;
    }
    const amount = await IoHelpers.enterNumber(
      `How many ${asset} should be transferred?`
    );
    if (amount === undefined) {
      return;
    }
    const walletNames = Object.keys(await identifier.getWalletAddresses());
    const sender = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from which wallet?`,
      ...walletNames
    );
    if (!sender) {
      return;
    }
    const receiver = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from '${sender}' to...`,
      ...walletNames
    );
    if (!receiver) {
      return;
    }
    const output = await neoExpress.run(
      "transfer",
      "-i",
      identifier.configPath,
      asset,
      `${amount}`,
      sender,
      receiver
    );
    NeoExpressCommands.showResult(output);
  }

  static async walletCreate(
    neoExpress: NeoExpress,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select("express"));
    if (!identifier) {
      return;
    }
    const walletName = await IoHelpers.enterString("Wallet name");
    if (!walletName) {
      return;
    }
    const output = await neoExpress.run(
      "wallet",
      "create",
      walletName,
      "-i",
      identifier.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  private static showResult(output: { message: string; isError?: boolean }) {
    if (output.isError) {
      vscode.window.showErrorMessage(output.message || "Unknown error");
    } else {
      vscode.window.showInformationMessage(
        output.message || "Command succeeded"
      );
    }
  }
}
