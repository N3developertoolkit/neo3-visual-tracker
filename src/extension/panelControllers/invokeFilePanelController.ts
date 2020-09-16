import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import BlockchainsExplorer from "../views/blockchainsExplorer";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";
import IoHelpers from "../ioHelpers";
import PanelControllerBase from "./panelControllerBase";

const LOG_PREFIX = "[InvokeFilePanelController]";

export default class InvokeFilePanelController extends PanelControllerBase<
  InvokeFileViewState,
  InvokeFileViewRequest
> {
  private changeWatcher: vscode.Disposable | null;
  private closed: boolean;
  private rpcClient: neonCore.rpc.RPCClient | null;

  constructor(
    context: vscode.ExtensionContext,
    private readonly document: vscode.TextDocument,
    private readonly blockchainsExplorer: BlockchainsExplorer,
    panel: vscode.WebviewPanel
  ) {
    super(
      {
        view: "invokeFile",
        panelTitle: "Loading...",
        fileContents: [],
        errorText: "",
        connectedTo: "",
      },
      context,
      panel
    );
    this.onFileUpdate();
    this.closed = false;
    this.changeWatcher = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.onFileUpdate();
      }
    });
    this.rpcClient = null;
  }

  onClose() {
    this.closed = true;
    if (this.changeWatcher) {
      this.changeWatcher.dispose();
      this.changeWatcher = null;
    }
  }

  protected async onRequest(request: InvokeFileViewRequest) {
    if (request.dismissError) {
      await this.onFileUpdate();
    }
    if (request.initiateConnection) {
      const blockchain = await this.blockchainsExplorer.select();
      let rpcUrl = blockchain?.rpcUrls[0];
      if ((blockchain?.rpcUrls.length || 0) > 1) {
        rpcUrl = await IoHelpers.multipleChoice(
          "Select an RPC server",
          ...blockchain?.rpcUrls
        );
      }
      if (rpcUrl) {
        this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
        this.updateViewState({ connectedTo: blockchain?.name });
        await this.onConnectOrDisconnect();
      } else {
        this.rpcClient = null;
        this.updateViewState({ connectedTo: "" });
        await this.onConnectOrDisconnect();
      }
    }
    if (request.disconnect) {
      this.rpcClient = null;
      this.updateViewState({ connectedTo: "" });
      await this.onConnectOrDisconnect();
    }
  }

  private async onConnectOrDisconnect() {
    // TODO
  }

  private async onFileUpdate() {
    if (this.closed) {
      return;
    }
    try {
      const fileText = this.document.getText();
      try {
        this.updateViewState({
          fileContents: JSON.parse(fileText),
          errorText: "",
        });
      } catch {
        this.updateViewState({
          errorText: `There was parsing ${this.document.uri.fsPath}, try opening the file using the built-in editor and confirm that it contains valid JSON.`,
        });
        return;
      }
    } catch {
      this.updateViewState({
        errorText: `There was an error reading ${this.document.uri.fsPath}`,
      });
      return;
    }
  }
}
