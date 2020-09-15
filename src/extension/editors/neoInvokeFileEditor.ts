import * as vscode from "vscode";

import InvokeFilePanelController from "../panelControllers/invokeFilePanelController";

export default class NeoInvokeFileEditor
  implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}
  resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel
  ): void | Thenable<void> {
    panel.webview.options = { enableScripts: true };
    new InvokeFilePanelController(
      this.context,
      document,
      panel
    );
  }
}
