import * as vscode from "vscode";

import BlockchainsExplorer from "../views/blockchainsExplorer";
import InvokeFilePanelController from "../panelControllers/invokeFilePanelController";

export default class NeoInvokeFileEditor
  implements vscode.CustomTextEditorProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly blockchainsExplorer: BlockchainsExplorer
  ) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel
  ): void | Thenable<void> {
    panel.webview.options = { enableScripts: true };
    new InvokeFilePanelController(
      this.context,
      document,
      this.blockchainsExplorer,
      panel
    );
  }
}
