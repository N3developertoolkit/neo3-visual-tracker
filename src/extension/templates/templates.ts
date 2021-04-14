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

    const languageCode = await IoHelpers.multipleChoice(
      "Choose a programming language",
      ...Object.keys(languages)
    );
    if (!languageCode) {
      return;
    }
    const language = languages[languageCode];

    const parameters = await Templates.gatherParameters(language);
    if (!parameters) {
      return;
    }

    const contractName = parameters["$_CONTRACTNAME_$"];
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

    await Templates.hydrateFiles(
      language,
      templatePath,
      contractPath,
      parameters
    );

    const mainFile = parameters["$_MAINFILE_$"];
    if (mainFile) {
      await vscode.window.showTextDocument(
        await vscode.workspace.openTextDocument(
          posixPath(contractPath, mainFile)
        )
      );
    }

    if (!language.tasks) {
      return;
    }

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

    let autorunTaskLabels: string[] = [];
    for (const task of language.tasks) {
      const taskJson = {
        options: { cwd: "${workspaceFolder}/" + contractName },
        label: `${contractName}: ${task.label}`,
        command: task.command,
        type: task.type,
        args: task.args,
        group: task.group,
        presentation: { reveal: "silent" },
        problemMatcher: task.problemMatcher,
        dependsOn: task.dependsOnLabel
          ? `${contractName}: ${task.dependsOnLabel}`
          : undefined,
      };
      (tasksJson.tasks as any[]).push(taskJson);
      if (task.autoRun) {
        autorunTaskLabels.push(taskJson.label);
      }
    }
    await fs.promises.writeFile(tasksJsonPath, JSONC.stringify(tasksJson));
    // TODO: Investigate ways to remove this sleep hack
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const tasks = await vscode.tasks.fetchTasks();
    const buildTasks = tasks.filter(
      (_) => autorunTaskLabels.indexOf(_.name) !== -1
    );
    for (const buildTask of buildTasks) {
      vscode.tasks.executeTask(buildTask);
    }
  }

  private static async gatherParameters(
    language: Language
  ): Promise<{ [key: string]: string } | undefined> {
    const result: { [key: string]: string } = {};
    if (language.variables) {
      for (const variableName of Object.keys(language.variables)) {
        const variable = language.variables[variableName];
        let value: string | undefined = "";
        if (variable.eval) {
          value = await variable.eval(result);
        }
        if (variable.prompt) {
          value = await IoHelpers.enterString(variable.prompt, value);
        }
        if (variable.parse) {
          value = await variable.parse(value);
        }
        if (!value) {
          // All variables are considered required
          return undefined;
        }
        result[`$_${variableName}_$`] = value;
      }
    }
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
