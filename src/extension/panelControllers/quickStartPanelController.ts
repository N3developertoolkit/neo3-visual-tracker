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
        hasNeoExpressInstance: false,
        workspaceIsOpen: false,
      },
      context,
      panel
    );
    vscode.workspace.onDidChangeWorkspaceFolders(() => this.refresh());
    this.blockchainsTreeDataProvider.onDidChangeTreeData(() => this.refresh());
    this.refresh();
  }

  onClose() {}

  refresh() {
    const hasNeoExpressInstance =
      this.blockchainsTreeDataProvider
        .getChildren()
        .filter((_) => _.blockchainType === "express").length > 0;

    const workspaceIsOpen = !!vscode.workspace.workspaceFolders?.length;

    this.updateViewState({ hasNeoExpressInstance, workspaceIsOpen });
  }

  protected async onRequest(request: QuickStartViewRequest) {
    if (request.createNeoExpressInstance) {
      await vscode.commands.executeCommand(
        "neo3-visual-devtracker.express.create"
      );
    }
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
