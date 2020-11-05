import * as vscode from "vscode";

import ActiveConnection from "../activeConnection";
import ContractDetector from "../detectors/contractDetector";
import InvokeFilePanelController from "../panelControllers/invokeFilePanelController";
import NeoExpress from "../neoExpress/neoExpress";

export default class NeoInvokeFileEditor
  implements vscode.CustomTextEditorProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly activeConnection: ActiveConnection,
    private readonly neoExpress: NeoExpress,
    private readonly contractDetector: ContractDetector
  ) {}

  resolveCustomTextEditor(
    document: vscode.TextDocument,
    panel: vscode.WebviewPanel
  ): void | Thenable<void> {
    panel.webview.options = { enableScripts: true };
    new InvokeFilePanelController(
      this.context,
      this.neoExpress,
      document,
      this.activeConnection,
      this.contractDetector,
      panel
    );
  }
}
