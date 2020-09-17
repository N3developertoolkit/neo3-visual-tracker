import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import ControllerRequest from "../../shared/messages/controllerRequest";
import ViewRequest from "../../shared/messages/viewRequest";
import ViewStateBase from "../../shared/viewState/viewStateBase";

const LOG_PREFIX = "[PanelControllerBase]";

export default abstract class PanelControllerBase<
  TViewState extends ViewStateBase,
  TViewRequest
> {
  protected get isClosed() {
    return this.closed;
  }

  protected viewState: TViewState;

  private closed: boolean;

  private readonly postMessage: (request: ControllerRequest) => void;

  private readonly setTitle: (newTitle: string) => void;

  constructor(
    initialViewState: TViewState,
    context: vscode.ExtensionContext,
    panel?: vscode.WebviewPanel
  ) {
    this.closed = false;
    this.viewState = { ...initialViewState };
    if (!panel) {
      panel = vscode.window.createWebviewPanel(
        `neo3-visual-tracker-${this.viewState.view}`,
        this.viewState.panelTitle,
        vscode.ViewColumn.Active,
        { enableScripts: true }
      );
      context.subscriptions.push(panel);
    }
    panel.onDidDispose(
      () => {
        this.closed = true;
        this.onClose();
      },
      null,
      context.subscriptions
    );
    panel.iconPath = vscode.Uri.file(
      path.join(context.extensionPath, "resources", "neo-logo.png")
    );
    panel.webview.onDidReceiveMessage(
      this.recieveRequest,
      this,
      context.subscriptions
    );
    this.postMessage = (message) => panel?.webview.postMessage(message);
    this.setTitle = (newTitle) => {
      if (panel) {
        panel.title = newTitle;
      }
    };
    panel.webview.html = fs
      .readFileSync(
        path.join(context.extensionPath, "dist", "panel", "index.html")
      )
      .toString()
      .replace(
        "[BASE_HREF]",
        panel.webview
          .asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, "dist", "panel"))
          )
          .toString() + "/"
      );
  }

  abstract onClose(): void;

  protected abstract onRequest(request: TViewRequest): void;

  protected updateViewState(updates: Partial<TViewState>) {
    if (this.closed) {
      return;
    }
    if (updates.panelTitle !== undefined) {
      this.setTitle(updates.panelTitle);
    }
    this.viewState = { ...this.viewState, ...updates };
    this.sendRequest({ viewState: this.viewState });
  }

  private recieveRequest(request: ViewRequest) {
    console.log(LOG_PREFIX, "📬", request);
    if (request.retrieveViewState) {
      this.sendRequest({ viewState: this.viewState });
    }
    if (request.typedRequest) {
      this.onRequest(request.typedRequest);
    }
  }

  private sendRequest(request: ControllerRequest) {
    console.log(LOG_PREFIX, "📤", request);
    this.postMessage(request);
  }
}
