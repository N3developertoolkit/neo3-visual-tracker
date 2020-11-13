import * as vscode from "vscode";

import BlockchainsTreeDataProvider from "../viewProviders/blockchainsTreeDataProvider";
import NeoExpressInstanceManager from "../neoExpress/neoExpressInstanceManager";
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
    private readonly blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    private readonly neoExpressInstanceManager: NeoExpressInstanceManager
  ) {
    super(
      {
        view: "quickStart",
        panelTitle: "",
        hasNeoExpressInstance: false,
        neoExpressIsRunning: false,
        workspaceIsOpen: false,
      },
      context,
      panel
    );
    vscode.workspace.onDidChangeWorkspaceFolders(() => this.refresh());
    this.blockchainsTreeDataProvider.onDidChangeTreeData(() => this.refresh());
    this.neoExpressInstanceManager.onChange(() => this.refresh());
    this.refresh();
  }

  onClose() {}

  refresh() {
    const hasNeoExpressInstance =
      this.blockchainsTreeDataProvider
        .getChildren()
        .filter((_) => _.blockchainType === "express").length > 0;

    const neoExpressIsRunning =
      this.neoExpressInstanceManager.runningInstance?.blockchainType ===
      "express";

    const workspaceIsOpen = !!vscode.workspace.workspaceFolders?.length;

    this.updateViewState({
      hasNeoExpressInstance,
      neoExpressIsRunning,
      workspaceIsOpen,
    });
  }

  protected async onRequest(request: QuickStartViewRequest) {
    if (request.command) {
      await vscode.commands.executeCommand(request.command);
    }
  }
}
