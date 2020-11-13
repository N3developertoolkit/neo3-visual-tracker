import * as vscode from "vscode";

import BlockchainsTreeDataProvider from "../viewProviders/blockchainsTreeDataProvider";
import PanelControllerBase from "./panelControllerBase";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";
import TrackerPanelController from "./trackerPanelController";

const LOG_PREFIX = "[QuickStartPanelController]";

export default class QuickStartPanelController extends PanelControllerBase<
  QuickStartViewState,
  QuickStartViewRequest
> {
  constructor(
    private readonly context: vscode.ExtensionContext,
    panel: vscode.WebviewView,
    private readonly blockchainsTreeDataProvider: BlockchainsTreeDataProvider
  ) {
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
    if (request.exploreTestNet) {
      const rpcUrl = await this.blockchainsTreeDataProvider
        .getChildren()[0]
        ?.selectRpcUrl();
      if (rpcUrl) {
        new TrackerPanelController(this.context, rpcUrl);
      }
    }
    if (request.openWorkspace) {
      await vscode.commands.executeCommand("vscode.openFolder");
    }
  }
}
