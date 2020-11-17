import * as vscode from "vscode";

import BlockchainIdentifier from "../blockchainIdentifier";
import ContractDetector from "../detectors/contractDetector";
import IoHelpers from "../ioHelpers";
import NeoExpress from "./neoExpress";
import NeoExpressInstanceManager from "./neoExpressInstanceManager";
import TrackerPanelController from "../panelControllers/trackerPanelController";

export default class NeoExpressCommands {
  static async contractDeploy(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier,
    contractDetector: ContractDetector
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    if (!Object.keys(contractDetector.contracts).length) {
      vscode.window.showErrorMessage(
        "No compiled contracts (*.nef files) were found in the current workspace."
      );
      return;
    }
    const walletNames = Object.keys(identifer.getWalletAddresses());
    const account = await IoHelpers.multipleChoice(
      "Select an account...",
      "genesis",
      ...walletNames
    );
    if (!account) {
      return;
    }
    const contractFile = await IoHelpers.multipleChoiceFiles(
      `Use account "${account}" to deploy...`,
      ...Object.values(contractDetector.contracts).map(
        (_) => _.absolutePathToNef
      )
    );
    if (!contractFile) {
      return;
    }
    const output = neoExpress.runSync(
      "contract",
      "deploy",
      contractFile,
      account,
      "-i",
      identifer.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  static async create(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress,
    neoExpressInstanceManager: NeoExpressInstanceManager
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
    const output = neoExpress.runSync(
      "create",
      "-f",
      "-c",
      nodeCount,
      configSavePath
    );
    NeoExpressCommands.showResult(output);
    NeoExpressCommands.showResult(output);
    if (!output.isError) {
      const identifier = BlockchainIdentifier.fromNeoExpressConfig(
        context.extensionPath,
        configSavePath
      );
      if (identifier) {
        await neoExpressInstanceManager.run(identifier);
        const rpcUrl = await identifier.selectRpcUrl();
        if (rpcUrl) {
          new TrackerPanelController(context, rpcUrl);
        }
      }
    }
  }

  static async customCommand(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const command = await IoHelpers.enterString("Enter a neo-express command");
    if (!command) {
      return;
    }
    const output = neoExpress.runSyncUnsafe(
      command,
      "-i",
      identifer.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  static async reset(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier,
    neoExpressInstanceManager: NeoExpressInstanceManager
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const confirmed = await IoHelpers.yesNo(
      `Are you sure that you want to reset "${identifer.configPath}"?`
    );
    if (!confirmed) {
      return;
    }
    const wasRunning =
      neoExpressInstanceManager.runningInstance?.configPath ===
      identifer.configPath;
    if (wasRunning) {
      await neoExpressInstanceManager.stop();
    }
    try {
      const output = neoExpress.runSync(
        "reset",
        "-f",
        "-i",
        identifer.configPath
      );
      NeoExpressCommands.showResult(output);
    } finally {
      if (wasRunning) {
        await neoExpressInstanceManager.run(identifer);
      }
    }
  }

  static async transfer(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "express") {
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
    const walletNames = Object.keys(identifer.getWalletAddresses());
    const sender = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from which wallet?`,
      "genesis",
      ...walletNames
    );
    if (!sender) {
      return;
    }
    const receiver = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from '${sender}' to...`,
      "genesis",
      ...walletNames
    );
    if (!receiver) {
      return;
    }
    const output = neoExpress.runSync(
      "transfer",
      "-i",
      identifer.configPath,
      asset,
      amount + "",
      sender,
      receiver
    );
    NeoExpressCommands.showResult(output);
  }

  static async walletCreate(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const walletName = await IoHelpers.enterString("Wallet name");
    if (!walletName) {
      return;
    }
    const output = neoExpress.runSync(
      "wallet",
      "create",
      walletName,
      "-i",
      identifer.configPath
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
