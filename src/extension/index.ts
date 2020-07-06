import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "neo3-visual-tracker.helloWorld",
    async () => {
      const panel = vscode.window.createWebviewPanel(
        "neo3-visual-tracker",
        "Title",
        vscode.ViewColumn.Active,
        { enableScripts: true }
      );
      panel.webview.html = fs
        .readFileSync(
          path.join(context.extensionPath, "dist", "panel", "index.html")
        )
        .toString()
        .replace(
          "[BASE_HREF]",
          panel.webview
            .asWebviewUri(
              vscode.Uri.file(path.join(context.extensionPath, "dist", "panel"))
            )
            .toString() + "/"
        );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
