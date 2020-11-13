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

    if (request.startNeoExpress) {
      await vscode.commands.executeCommand(
        "neo3-visual-devtracker.express.run"
      );
    }
  }
}
