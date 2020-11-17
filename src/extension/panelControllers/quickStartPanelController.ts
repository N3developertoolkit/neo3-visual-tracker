import * as vscode from "vscode";

import BlockchainsTreeDataProvider from "../viewProviders/blockchainsTreeDataProvider";
import ContractDetector from "../detectors/contractDetector";
import NeoExpressInstanceManager from "../neoExpress/neoExpressInstanceManager";
import PanelControllerBase from "./panelControllerBase";
import QuickStartViewRequest from "../../shared/messages/quickStartFileViewRequest";
import QuickStartViewState from "../../shared/viewState/quickStartViewState";

const LOG_PREFIX = "[QuickStartPanelController]";

export default class QuickStartPanelController extends PanelControllerBase<
  QuickStartViewState,
  QuickStartViewRequest
> {
  constructor(
    context: vscode.ExtensionContext,
    panel: vscode.WebviewView,
    private readonly blockchainsTreeDataProvider: BlockchainsTreeDataProvider,
    private readonly neoExpressInstanceManager: NeoExpressInstanceManager,
    private readonly contractDetector: ContractDetector
  ) {
    super(
      {
        view: "quickStart",
        panelTitle: "",
        hasContracts: false,
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
    this.contractDetector.onChange(() => this.refresh());
    this.refresh();
  }

  onClose() {}

  refresh() {
    const hasContracts =
      Object.keys(this.contractDetector.contracts).length > 0;

    const hasNeoExpressInstance =
      this.blockchainsTreeDataProvider
        .getChildren()
        .filter((_) => _.blockchainType === "express").length > 0;

    const neoExpressIsRunning =
      this.neoExpressInstanceManager.runningInstance?.blockchainType ===
      "express";

    const workspaceIsOpen = !!vscode.workspace.workspaceFolders?.length;

    this.updateViewState({
      hasContracts,
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
