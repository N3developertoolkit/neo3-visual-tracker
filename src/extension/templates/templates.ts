import * as fs from "fs";
import * as vscode from "vscode";

import IoHelpers from "../util/ioHelpers";
import JSONC from "../util/JSONC";
import posixPath from "../util/posixPath";
import workspaceFolder from "../util/workspaceFolder";

export default class Templates {
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

    // TODO: Multi language support
    const language = "csharp";

    const contractPath = posixPath(rootFolder, contractName);
    const templatePath = posixPath(
      context.extensionPath,
      "resources",
      "new-contract",
      language
    );
    if (fs.existsSync(contractPath)) {
      vscode.window.showErrorMessage(
        `A contract called ${contractName} already exists in this vscode.workspace.`
      );
      return;
    }

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
    await doCopy("Directory.Build.Props");
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(
        posixPath(contractPath, `${contractName}Contract.cs`)
      )
    );

    const dotVsCodeFolderPath = posixPath(rootFolder, ".vscode");
    const tasksJsonPath = posixPath(dotVsCodeFolderPath, "tasks.json");
    try {
      await fs.promises.mkdir(dotVsCodeFolderPath);
    } catch {}
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
