import * as vscode from "vscode";

import PanelControllerBase from "./panelControllerBase";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";

const LOG_PREFIX = "[QuickStartPanelController]";

export default class QuickStartPanelController extends PanelControllerBase<
  QuickStartViewState,
  QuickStartViewRequest
> {
  constructor(context: vscode.ExtensionContext, panel: vscode.WebviewView) {
    super(
      {
        view: "quickStart",
        panelTitle: "",
        workspaceIsOpen: !!vscode.workspace.workspaceFolders?.length,
      },
      context,
      panel
    );
    vscode.workspace.onDidChangeWorkspaceFolders(() => this.refresh());
  }

  onClose() {}

  refresh() {
    const workspaceIsOpen = !!vscode.workspace.workspaceFolders?.length;
    this.updateViewState({ workspaceIsOpen });
  }

  protected async onRequest(request: QuickStartViewRequest) {
    if (request.openWorkspace) {
      await vscode.commands.executeCommand("vscode.openFolder");
    }
  }
}
