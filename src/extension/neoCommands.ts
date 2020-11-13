import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";
import * as path from "path";
import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import ContractDetector from "./detectors/contractDetector";
import IoHelpers from "./ioHelpers";
import WalletDetector from "./detectors/walletDetector";

export default class NeoCommands {
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
    const rpcUrl = await identifer.selectRpcUrl();
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
    // const deployScript = neonJs.sc.generateDeployScript({
    //   manifest: JSON.stringify(contract.manifest),
    //   script,
    // }).str;
    await vscode.window.showInformationMessage(
      `Coming soon: TestNet deployment/invocation`
    );
  }

  static async createWallet() {
    const account = new neonCore.wallet.Account(
      neonCore.wallet.generatePrivateKey()
    );
    account.label = "Default account";
    const walletName = await IoHelpers.enterString(
      "Enter a name for the wallet"
    );
    if (!walletName) {
      return;
    }
    const wallet = new neonCore.wallet.Wallet({ name: walletName });
    wallet.addAccount(account);
    wallet.setDefault(0);
    const password = await IoHelpers.choosePassword(
      "Choose a password for the wallet (press Enter for none)",
      true
    );
    if (!password && password !== "") {
      return;
    }
    if (!(await wallet.encryptAll(password))) {
      await vscode.window.showErrorMessage(
        "Could not encrypt the wallet using the supplied password"
      );
    }
    const walletJson = JSON.stringify(wallet.export(), undefined, 2);
    // TODO: Auto-save in current workspace
    const textDocument = await vscode.workspace.openTextDocument({
      language: "json",
      content: walletJson,
    });
    await vscode.window.showTextDocument(textDocument);
  }
}
