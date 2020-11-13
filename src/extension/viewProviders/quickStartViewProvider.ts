import * as vscode from "vscode";

import BlockchainsTreeDataProvider from "./blockchainsTreeDataProvider";
import NeoExpressInstanceManager from "../neoExpress/neoExpressInstanceManager";
import QuickStartPanelController from "../panelControllers/quickStartPanelController";

export default class QuickStartViewProvider
  implements vscode.WebviewViewProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    private readonly neoExpressInstanceManager: NeoExpressInstanceManager
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    new QuickStartPanelController(
      this.context,
      webviewView,
      this.blockchainsTreeDataProvider,
      this.neoExpressInstanceManager
    );
  }
}
