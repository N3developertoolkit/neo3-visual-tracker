import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import * as neonCore from "@cityofzion/neon-core";

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

  const rpcClient = new neonCore.rpc.RPCClient("http://seed1t.neo.org:20332");
  setInterval(async () => {
    const blockNumber = await rpcClient.getBlockCount();
    console.log("Block height", blockNumber);
  }, 5000);
}

export function deactivate() {}
