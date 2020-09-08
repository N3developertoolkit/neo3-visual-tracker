import * as vscode from "vscode";

export default class IoHelpers {
  static async enterNumber(prompt: string): Promise<number | undefined> {
    const input = await vscode.window.showInputBox({
      prompt,
      validateInput: (_) =>
        isNaN(parseFloat(_)) ? "Enter a numeric value" : null,
    });
    if (input) {
      return parseFloat(input);
    } else {
      return undefined;
    }
  }

  static async multipleChoice(placeHolder: string, ...items: string[]) {
    return await vscode.window.showQuickPick(items, {
      canPickMany: false,
      placeHolder,
    });
  }

  static async pickFolder(
    defaultUri?: vscode.Uri
  ): Promise<string | undefined> {
    const selections = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      defaultUri,
      openLabel: "Select folder",
      canSelectMany: false,
      canSelectFiles: false,
    });
    if (selections && selections.length) {
      return selections[0].fsPath;
    } else {
      return undefined;
    }
  }

  static async pickSaveFile(
    verb: string,
    fileTypeDescription: string,
    fileTypeExtension: string,
    defaultUri?: vscode.Uri
  ): Promise<string | undefined> {
    const filters: any = {};
    filters[fileTypeDescription] = [fileTypeExtension];
    return (
      await vscode.window.showSaveDialog({
        defaultUri,
        filters,
        saveLabel: verb,
      })
    )?.fsPath;
  }

  static async yesNo(question: string): Promise<boolean> {
    const choice = await vscode.window.showErrorMessage(
      question,
      { modal: true },
      { title: "Yes" },
      { title: "No", isCloseAffordance: true }
    );
    return choice?.title === "Yes";
  }
}
