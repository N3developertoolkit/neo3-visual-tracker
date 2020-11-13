import * as vscode from "vscode";

import QuickStartPanelController from "../panelControllers/quickStartPanelController";

export default class QuickStartViewProvider
  implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    new QuickStartPanelController(this.context, webviewView);
  }
}
