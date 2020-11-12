import * as fs from "fs";
import * as neonJs from "@cityofzion/neon-js";
import * as path from "path";
import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import ContractDetector from "./detectors/contractDetector";
import IoHelpers from "./ioHelpers";
import TrackerPanelController from "./panelControllers/trackerPanelController";
import WalletDetector from "./detectors/walletDetector";

export default class TrackerCommands {
  static async contractDeploy(
    identifer: BlockchainIdentifier,
    contractDetector: ContractDetector,
    walletDetector: WalletDetector
  ) {
    const wallets = walletDetector.wallets;
    if (!wallets.length) {
      vscode.window.showErrorMessage(
        "No NEP-6 wallets were found in the current workspace."
      );
      return;
    }
    if (!Object.keys(contractDetector.contracts).length) {
      vscode.window.showErrorMessage(
        "No compiled contracts (*.nef files) were found in the current workspace."
      );
      return;
    }
    const rpcUrl = await TrackerCommands.selectRpcUrl(identifer);
    if (!rpcUrl) {
      return;
    }
    const walletPath = await IoHelpers.multipleChoiceFiles(
      "Select a wallet for the deployment...",
      ...wallets.map((_) => _.path)
    );
    const wallet = wallets.find((_) => _.path === walletPath);
    if (!wallet) {
      return;
    }
    const walletAddresses = wallet.addresses;
    if (!walletAddresses.length) {
      return;
    }
    let walletAddress: string | undefined = walletAddresses[0];
    if (walletAddresses.length > 1) {
      walletAddress = await IoHelpers.multipleChoice(
        `Select an address from wallet ${path.basename(walletPath)}...`,
        ...walletAddresses
      );
    }
    if (!walletAddress) {
      return;
    }
    const contracts = contractDetector.contracts;
    const contractFile = await IoHelpers.multipleChoiceFiles(
      `Deploy contract using ${walletAddress} (from ${path.basename(
        walletPath
      )})`,
      ...Object.values(contracts).map((_) => _.absolutePathToNef)
    );
    const contract = Object.values(contracts).find(
      (_) => _.absolutePathToNef === contractFile
    );
    if (!contract) {
      return;
    }
    let script = "";
    try {
      script = fs.readFileSync(contract.absolutePathToNef).toString("hex");
    } catch (e) {
      await vscode.window.showErrorMessage(
        `Could not read contract: ${contract.absolutePathToNef}`
      );
    }
    const deployScript = neonJs.sc.generateDeployScript({
      manifest: JSON.stringify(contract.manifest),
      script,
    }).str;
    await vscode.window.showInformationMessage(
      `Coming soon: TestNet deployment/invocation\n${deployScript}`
    );
  }

  static async openTracker(
    context: vscode.ExtensionContext,
    identifer: BlockchainIdentifier
  ) {
    const rpcUrl = await TrackerCommands.selectRpcUrl(identifer);
    if (rpcUrl) {
      new TrackerPanelController(context, rpcUrl);
    }
  }

  private static async selectRpcUrl(
    identifer: BlockchainIdentifier
  ): Promise<string | undefined> {
    const children = identifer.getChildren();
    if (children.length === 1) {
      return await TrackerCommands.selectRpcUrl(children[0]);
    } else if (children.length > 1) {
      const selection = await IoHelpers.multipleChoice(
        "Select an RPC server",
        ...children.map((_, i) => `${i} - ${_.name}`)
      );
      if (!selection) {
        return;
      }
      const selectedIndex = parseInt(selection);
      return await TrackerCommands.selectRpcUrl(children[selectedIndex]);
    } else {
      return identifer.rpcUrls[0];
    }
  }
}
