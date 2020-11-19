import * as vscode from "vscode";

import ActiveConnection from "../activeConnection";
import BlockchainsTreeDataProvider from "../providers/blockchainsTreeDataProvider";
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
    private readonly contractDetector: ContractDetector,
    private readonly activeConnection: ActiveConnection
  ) {
    super(
      {
        view: "quickStart",
        panelTitle: "",
        connectionName: null,
        hasContracts: false,
        hasNeoExpressInstance: false,
        neoDeploymentRequired: false,
        neoExpressDeploymentRequired: false,
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
    const connectionName =
      this.activeConnection.connection?.blockchainIdentifier.friendlyName ||
      null;

    let neoDeploymentRequired = false;
    let neoExpressDeploymentRequired = false;
    const deploymentRequired =
      Object.values(this.contractDetector.contracts).filter(
        (_) => _.deploymentRequired
      ).length > 0;
    if (deploymentRequired) {
      if (
        this.activeConnection.connection?.blockchainIdentifier
          .blockchainType === "express"
      ) {
        neoExpressDeploymentRequired = true;
      } else {
        neoDeploymentRequired = true;
      }
    }

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
      connectionName,
      hasContracts,
      hasNeoExpressInstance,
      neoDeploymentRequired,
      neoExpressDeploymentRequired,
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
