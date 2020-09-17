import * as vscode from "vscode";

import BlockchainsExplorer from "../views/blockchainsExplorer";
import ContractDetector from "../contractDetector";
import InvokeFilePanelController from "../panelControllers/invokeFilePanelController";
import NeoExpress from "../neoExpress/neoExpress";

export default class NeoInvokeFileEditor
  implements vscode.CustomTextEditorProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly blockchainsExplorer: BlockchainsExplorer,
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
      this.blockchainsExplorer,
      this.contractDetector,
      panel
    );
  }
}
