import * as vscode from "vscode";

import BlockchainIdentifier from "../blockchainIdentifier";
import ContractDetector from "../detectors/contractDetector";
import IoHelpers from "../ioHelpers";
import NeoExpress from "./neoExpress";

export default class NeoExpressCommands {
  static async contractDeploy(
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier,
    contractDetector: ContractDetector
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    if (!contractDetector.contracts.length) {
      vscode.window.showErrorMessage(
        "No compiled contracts (*.nef files) were found in the current workspace."
      );
      return;
    }
    const account = await IoHelpers.multipleChoice(
      "Select an account...",
      "genesis",
      ...identifer.wallets
    );
    if (!account) {
      return;
    }
    const contractFile = await IoHelpers.multipleChoiceFiles(
      `Use account "${account}" to deploy...`,
      ...contractDetector.contracts
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
    neoExpress: NeoExpress
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
      context.extensionUri
    );
    if (!configSavePath) {
      return;
    }
    const output = neoExpress.runSync(
      "create",
      "-c",
      nodeCount,
      "-o",
      configSavePath,
      "-f"
    );
    NeoExpressCommands.showResult(output);
  }

  static async reset(neoExpress: NeoExpress, identifer: BlockchainIdentifier) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const confirmed = await IoHelpers.yesNo(
      `Are you sure that you want to reset "${identifer.configPath}"?`
    );
    if (!confirmed) {
      return;
    }
    const output = neoExpress.runSync(
      "reset",
      "-f",
      "-i",
      identifer.configPath
    );
    NeoExpressCommands.showResult(output);
  }

  static async run(
    context: vscode.ExtensionContext,
    neoExpress: NeoExpress,
    identifer: BlockchainIdentifier
  ) {
    if (identifer.blockchainType !== "express") {
      return;
    }
    const children = identifer.getChildren();
    if (children.length === 1) {
      NeoExpressCommands.run(context, neoExpress, children[0]);
    } else if (children.length > 1) {
      const selection = await IoHelpers.multipleChoice(
        "Select a node",
        ...children.map((_, i) => `${i} - ${_.name}`)
      );
      if (!selection) {
        return;
      }
      const selectedIndex = parseInt(selection);
      NeoExpressCommands.run(context, neoExpress, children[selectedIndex]);
    } else {
      neoExpress.runInTerminal(
        identifer.name,
        "run",
        "-i",
        identifer.configPath,
        "-s",
        "15",
        `${identifer.index}`
      );
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
    const sender = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from which wallet?`,
      "genesis",
      ...identifer.wallets
    );
    if (!sender) {
      return;
    }
    const receiver = await IoHelpers.multipleChoice(
      `Transfer ${amount} ${asset} from '${sender}' to...`,
      "genesis",
      ...identifer.wallets
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
