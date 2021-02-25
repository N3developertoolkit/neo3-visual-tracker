import * as fs from "fs";
import * as neonCore from "@cityofzion/neon-core";
import * as neonExperimental from "../neonExperimental";
import * as path from "path";
import * as vscode from "vscode";

import ActiveConnection from "../activeConnection";
import BlockchainsTreeDataProvider from "../vscodeProviders/blockchainsTreeDataProvider";
import { CommandArguments } from "../commandArguments";
import ContractDetector from "../fileDetectors/contractDetector";
import IoHelpers from "../util/ioHelpers";
import JSONC from "../util/JSONC";
import posixPath from "../util/posixPath";
import WalletDetector from "../fileDetectors/walletDetector";
import workspaceFolder from "../util/workspaceFolder";

export default class NeoCommands {
  static async contractDeploy(
    contractDetector: ContractDetector,
    walletDetector: WalletDetector,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select());
    if (!identifier) {
      return;
    }
    const wallets = walletDetector.wallets;
    if (!wallets.length) {
      vscode.window.showErrorMessage(
        "No NEP-6 wallets were found in the current workspace."
      );
      return;
    }
    if (!Object.keys(contractDetector.contracts).length) {
      vscode.window.showErrorMessage(
        "No compiled contracts were found in the current workspace. A compiled contract (*.nef file) along with its manifest (*.manifest.json file) is required for deployment."
      );
      return;
    }
    const rpcUrl = await identifier.selectRpcUrl();
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
    const walletAccounts = wallet.accounts;
    if (!walletAccounts.length) {
      return;
    }
    let account: neonCore.wallet.Account | undefined = walletAccounts[0];
    if (walletAccounts.length > 1) {
      const selectedAddress = await IoHelpers.multipleChoice(
        `Select an address from wallet ${path.basename(walletPath)}...`,
        ...walletAccounts.map((_) => _.address)
      );
      account = walletAccounts.find((_) => _.address === selectedAddress);
    }
    if (!account) {
      return;
    }
    const contracts = contractDetector.contracts;
    const contractFile =
      commandArguments.path ||
      (await IoHelpers.multipleChoiceFiles(
        `Deploy contract using ${account.address} (from ${path.basename(
          walletPath
        )})`,
        ...Object.values(contracts).map((_) => _.absolutePathToNef)
      ));
    const contract = Object.values(contracts).find(
      (_) => _.absolutePathToNef === contractFile
    );
    if (!contract) {
      return;
    }
    let contractByteCode: Buffer;
    try {
      contractByteCode = await fs.promises.readFile(
        contract.absolutePathToNef,
        null
      );
    } catch (e) {
      vscode.window.showErrorMessage(
        `Could not read contract: ${contract.absolutePathToNef}`
      );
      return;
    }

    const rpcAddress = await identifier.selectRpcUrl();
    if (!rpcAddress) {
      return;
    }

    try {
      const manifestJson = contract.manifest;
      if (
        !manifestJson.abi ||
        !manifestJson.extra ||
        !manifestJson.groups ||
        !manifestJson.name ||
        !manifestJson.permissions ||
        !manifestJson.supportedstandards ||
        !manifestJson.trusts
      ) {
        throw Error("Could not deploy the contract as manifest was incomplete");
      }
      const manifest = neonCore.sc.ContractManifest.fromJson(
        (manifestJson as unknown) as neonCore.sc.ContractManifestJson
      );
      const result = await neonExperimental.deployContract(
        contractByteCode,
        manifest,
        {
          networkMagic: neonCore.CONST.MAGIC_NUMBER.TestNet,
          rpcAddress,
          account,
          networkFeeOverride: neonCore.u.BigInteger.fromNumber(200),
          systemFeeOverride: neonCore.u.BigInteger.fromNumber(200),
        }
      );
      vscode.window.showInformationMessage(result);
    } catch (e) {
      // TODO: Debug why this is not currently working
      vscode.window.showErrorMessage(
        e.message || "Could not deploy contract: Unknown error"
      );
      console.error(e);
    }
  }

  static async createWallet() {
    const rootFolder = workspaceFolder();
    if (!rootFolder) {
      vscode.window.showErrorMessage(
        "Please open a folder in your Visual Studio Code workspace before creating a wallet"
      );
      return;
    }
    const walletFilesFolder = posixPath(rootFolder, "wallets");
    try {
      await fs.promises.mkdir(walletFilesFolder);
    } catch {}
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
      vscode.window.showErrorMessage(
        "Could not encrypt the wallet using the supplied password"
      );
    }
    const walletJson = JSONC.stringify(wallet.export());
    const safeWalletName = walletName.replace(/[^-_.a-z0-9]/gi, "-");
    let filename = posixPath(
      walletFilesFolder,
      `${safeWalletName}.neo-wallet.json`
    );
    let i = 0;
    while (fs.existsSync(filename)) {
      i++;
      filename = posixPath(
        walletFilesFolder,
        `${safeWalletName} (${i}).neo-wallet.json`
      );
    }
    await fs.promises.writeFile(filename, walletJson);
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(filename)
    );
  }

  static async invokeContract(
    activeConnection: ActiveConnection,
    blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    commandArguments?: CommandArguments
  ) {
    const identifier =
      commandArguments?.blockchainIdentifier ||
      (await blockchainsTreeDataProvider.select());
    if (!identifier) {
      return;
    }
    if (
      activeConnection.connection?.blockchainIdentifier.name !== identifier.name
    ) {
      await activeConnection.connect(identifier);
    }
    const rootFolder = workspaceFolder();
    if (!rootFolder) {
      vscode.window.showErrorMessage(
        "Please open a folder in your Visual Studio Code workspace before invoking a contract"
      );
      return;
    }
    const invokeFilesFolder = posixPath(rootFolder, "invoke-files");
    try {
      await fs.promises.mkdir(invokeFilesFolder);
    } catch {}
    let filename = posixPath(invokeFilesFolder, "Untitled.neo-invoke.json");
    let i = 0;
    while (fs.existsSync(filename)) {
      i++;
      filename = posixPath(
        invokeFilesFolder,
        `Untitled (${i}).neo-invoke.json`
      );
    }
    await fs.promises.writeFile(filename, "[{}]");
    await vscode.commands.executeCommand(
      "vscode.open",
      vscode.Uri.file(filename)
    );
  }

  static async newContract(context: vscode.ExtensionContext) {
    const rootFolder = workspaceFolder();
    if (!rootFolder) {
      vscode.window.showErrorMessage(
        "Please open a folder in your Visual Studio Code workspace before creating a contract"
      );
      return;
    }

    let contractName = await IoHelpers.enterString(
      "Enter name for your contract (e.g. TokenEscrow)"
    );
    if (contractName?.toLocaleLowerCase().endsWith("contract")) {
      contractName = contractName.replace(/contract$/i, "");
    }
    if (!contractName) {
      return;
    }
    if (!contractName[0].match(/[a-z]/i)) {
      contractName = "_" + contractName;
    }
    contractName = contractName.replace(/[^a-z0-9]+/gi, "_");
    if (!contractName) {
      return;
    }

    const dotVsCodeFolderPath = posixPath(rootFolder, ".vscode");
    const tasksJsonPath = posixPath(dotVsCodeFolderPath, "tasks.json");
    const contractPath = posixPath(rootFolder, contractName);
    const templatePath = posixPath(
      context.extensionPath,
      "resources",
      "new-contract"
    );
    if (fs.existsSync(contractPath)) {
      vscode.window.showErrorMessage(
        `A contract called ${contractName} already exists in this vscode.workspace.`
      );
      return;
    }
    try {
      await fs.promises.mkdir(dotVsCodeFolderPath);
    } catch {}
    const doSubstitutions = (text: string) =>
      text
        .replace(/\$_CLASSNAME_\$/g, `${contractName}Contract`)
        .replace(/\$_NAMESPACENAME_\$/g, `${contractName}`);
    const doCopy = async (srcFile: string) => {
      const dstFile = doSubstitutions(srcFile);
      const dstFileAbsolute = posixPath(contractPath, dstFile);
      const srcFileAbsolute = posixPath(
        templatePath,
        `${srcFile}.template.txt`
      );
      await fs.promises.copyFile(srcFileAbsolute, dstFileAbsolute);
      await fs.promises.writeFile(
        dstFileAbsolute,
        doSubstitutions(
          (await fs.promises.readFile(dstFileAbsolute)).toString()
        )
      );
    };
    await fs.promises.mkdir(contractPath);
    await doCopy("$_CLASSNAME_$.cs");
    await doCopy("$_CLASSNAME_$.csproj");
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(
        posixPath(contractPath, `${contractName}Contract.cs`)
      )
    );

    let tasksJsonTxt = "";
    let tasksJson: { version: string; tasks: any } = {
      version: "2.0.0",
      tasks: [],
    };
    try {
      tasksJsonTxt = (await fs.promises.readFile(tasksJsonPath)).toString();
      tasksJson = JSONC.parse(tasksJsonTxt);
      if (tasksJson.tasks) {
        if (!Array.isArray(tasksJson.tasks)) {
          return;
        }
      } else {
        tasksJson.tasks = [];
      }
    } catch {}
    const newTask = (
      label: string,
      args: string[],
      problemMatcher: string | any[],
      dependsOn?: string
    ) => ({
      options: { cwd: "${workspaceFolder}/" + contractName },
      label: `${contractName}: ${label}`,
      command: "dotnet",
      type: "shell",
      args,
      group: "build",
      presentation: { reveal: "silent" },
      problemMatcher,
      dependsOn: dependsOn ? `${contractName}: ${dependsOn}` : undefined,
    });
    (tasksJson.tasks as any[]).push(newTask("restore", ["restore"], []));
    (tasksJson.tasks as any[]).push(
      newTask(
        "build",
        [
          "build",
          "/property:GenerateFullPaths=true",
          "/consoleloggerparameters:NoSummary",
        ],
        "$msCompile",
        "restore"
      )
    );
    const buildTaskLabel = tasksJson.tasks[tasksJson.tasks.length - 1].label;
    await fs.promises.writeFile(tasksJsonPath, JSONC.stringify(tasksJson));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const tasks = await vscode.tasks.fetchTasks();
    const buildTask = tasks.filter((_) => _.name === buildTaskLabel)[0];
    if (buildTask) {
      vscode.tasks.executeTask(buildTask);
    }
  }
}
