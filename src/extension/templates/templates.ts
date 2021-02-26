import * as fs from "fs";
import * as vscode from "vscode";

import IoHelpers from "../util/ioHelpers";
import JSONC from "../util/JSONC";
import { Language, languages } from "./languages";
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
    const languageCode = "csharp";
    const language = languages[languageCode];

    const contractPath = posixPath(rootFolder, contractName);
    const templatePath = posixPath(
      context.extensionPath,
      "resources",
      "new-contract",
      languageCode
    );
    if (fs.existsSync(contractPath)) {
      vscode.window.showErrorMessage(
        `A contract called ${contractName} already exists in this vscode.workspace.`
      );
      return;
    }

    const parameters = await Templates.gatherParameters(language, contractName);
    if (!parameters) {
      return;
    }

    await Templates.hydrateFiles(
      language,
      templatePath,
      contractPath,
      parameters
    );

    //
    // TODO: Make this language-agnostic
    //
    await vscode.window.showTextDocument(
      await vscode.workspace.openTextDocument(
        posixPath(contractPath, `${contractName}Contract.cs`)
      )
    );

    //
    // TODO: Make this language-agnostic
    //
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

  private static async gatherParameters(
    language: Language,
    contractName: string
  ): Promise<{ [key: string]: string } | undefined> {
    const result = {
      $_CLASSNAME_$: `${contractName}Contract`,
      $_NAMESPACENAME_$: contractName,
    };
    // TODO: Custom language-specific substitutions
    console.log(language); // remove
    //
    return result;
  }

  private static async hydrateFiles(
    language: Language,
    templatePath: string,
    destinationPath: string,
    parameters: { [key: string]: string }
  ) {
    await fs.promises.mkdir(destinationPath, { recursive: true });
    const templateFolderContents = await fs.promises.readdir(templatePath);
    for (const item of templateFolderContents) {
      const fullPathToSource = posixPath(templatePath, item);
      const resolvedName = await Templates.substituteParameters(
        item,
        parameters
      );
      const fullPathToDestination = posixPath(destinationPath, resolvedName);
      const stat = await fs.promises.stat(fullPathToSource);
      if (stat.isDirectory()) {
        await Templates.hydrateFiles(
          language,
          fullPathToSource,
          posixPath(destinationPath, resolvedName),
          parameters
        );
      } else if (item.endsWith(".template.txt")) {
        const fileContents = (
          await fs.promises.readFile(fullPathToSource)
        ).toString();
        const resolvedContents = await Templates.substituteParameters(
          fileContents,
          parameters
        );
        await fs.promises.writeFile(
          fullPathToDestination.replace(/\.template\.txt$/, ""),
          resolvedContents
        );
      } else {
        await fs.promises.copyFile(fullPathToSource, fullPathToDestination);
      }
    }
  }

  private static async substituteParameters(
    input: string,
    parameters: { [key: string]: string }
  ): Promise<string> {
    let result = input;
    for (const key of Object.keys(parameters)) {
      result = result.replaceAll(key, parameters[key]);
    }
    return result;
  }
}
