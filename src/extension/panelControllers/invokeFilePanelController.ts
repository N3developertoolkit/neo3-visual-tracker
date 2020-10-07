import * as neonCore from "@cityofzion/neon-core";
import * as path from "path";
import * as vscode from "vscode";
import { ContractManifestJson } from "@cityofzion/neon-core/lib/sc";

import BlockchainIdentifier from "../views/blockchainIdentifier";
import BlockchainsExplorer from "../views/blockchainsExplorer";
import ContractDetector from "../detectors/contractDetector";
import InvokeFileViewRequest from "../../shared/messages/invokeFileViewRequest";
import InvokeFileViewState from "../../shared/viewState/invokeFileViewState";
import IoHelpers from "../ioHelpers";
import NeoExpress from "../neoExpress/neoExpress";
import NeoExpressIo from "../neoExpress/neoExpressIo";
import PanelControllerBase from "./panelControllerBase";

const LOG_PREFIX = "[InvokeFilePanelController]";
const REFRESH_INTERVAL_MS = 1000 * 15; // check for new contracts every 15 seconds when connected

export default class InvokeFilePanelController extends PanelControllerBase<
  InvokeFileViewState,
  InvokeFileViewRequest
> {
  private changeWatcher: vscode.Disposable | null;
  private rpcClient: neonCore.rpc.RPCClient | null;
  private blockchainIdentifier: BlockchainIdentifier | null;

  constructor(
    context: vscode.ExtensionContext,
    private readonly neoExpress: NeoExpress,
    private readonly document: vscode.TextDocument,
    private readonly blockchainsExplorer: BlockchainsExplorer,
    private readonly contractDetector: ContractDetector,
    panel: vscode.WebviewPanel
  ) {
    super(
      {
        view: "invokeFile",
        panelTitle: "Invoke File Editor",
        fileContents: [],
        contracts: {},
        nefHints: {},
        addressSuggestions: [],
        errorText: "",
        connectedTo: "",
        connectionState: "none",
      },
      context,
      panel
    );
    this.onFileUpdate();
    this.changeWatcher = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.onFileUpdate();
      }
    });
    this.rpcClient = null;
    this.blockchainIdentifier = null;
    this.refreshLoop();
  }

  onClose() {
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
      this.blockchainIdentifier =
        (await this.blockchainsExplorer.select()) || null;
      let rpcUrl = this.blockchainIdentifier?.rpcUrls[0];
      if ((this.blockchainIdentifier?.rpcUrls.length || 0) > 1) {
        rpcUrl = await IoHelpers.multipleChoice(
          "Select an RPC server",
          ...this.blockchainIdentifier?.rpcUrls
        );
      }
      if (rpcUrl) {
        this.rpcClient = new neonCore.rpc.RPCClient(rpcUrl);
        this.updateViewState({
          connectedTo: this.blockchainIdentifier?.name,
          connectionState: "connecting",
        });
        await this.periodicViewStateUpdate();
      } else {
        this.rpcClient = null;
        this.updateViewState({ connectedTo: "", connectionState: "none" });
        await this.periodicViewStateUpdate();
      }
    }
    if (request.disconnect) {
      this.rpcClient = null;
      this.blockchainIdentifier = null;
      this.updateViewState({ connectedTo: "", connectionState: "none" });
      await this.periodicViewStateUpdate();
    }
    if (request.update !== undefined) {
      let newFileContents = [...this.viewState.fileContents];
      if (request.update.i === newFileContents.length) {
        newFileContents.push({});
      }
      newFileContents = newFileContents.map((invocation, i) => {
        if (i === request.update?.i) {
          return {
            contract: request.update.contract,
            operation: request.update.operation,
            args: request.update.args,
          };
        } else {
          return invocation;
        }
      });
      const edit = new vscode.WorkspaceEdit();
      edit.replace(
        this.document.uri,
        new vscode.Range(0, 0, this.document.lineCount, 0),
        JSON.stringify(newFileContents, undefined, 2)
      );
      await vscode.workspace.applyEdit(edit);
    }
    if (request.run) {
      if (this.blockchainIdentifier) {
        const account = await IoHelpers.multipleChoice(
          "Select an account...",
          "genesis",
          ...this.blockchainIdentifier.wallets
        );
        if (!account) {
          return;
        }
        await this.document.save();
        this.neoExpress.runInTerminal(
          path.basename(this.document.uri.fsPath),
          "contract",
          "invoke",
          "-i",
          this.blockchainIdentifier.configPath,
          this.document.uri.fsPath,
          account
        );
      }
    }
  }

  private async refreshLoop() {
    if (this.isClosed) {
      return;
    }
    try {
      await this.periodicViewStateUpdate();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async periodicViewStateUpdate() {
    const baseHref = path.dirname(this.document.uri.fsPath);
    const contracts: { [hashOrNefFile: string]: ContractManifestJson } = {};
    const nefHints: { [hash: string]: { [nefPath: string]: boolean } } = {};
    let addressSuggestions: string[] = [];
    let connectionState: "none" | "ok" | "connecting" = "none";
    if (this.blockchainIdentifier?.blockchainType === "nxp3") {
      try {
        addressSuggestions = this.blockchainIdentifier.walletAddresses;
        const deployedContracts = await NeoExpressIo.contractList(
          this.neoExpress,
          this.blockchainIdentifier
        );
        connectionState = "ok";
        for (const deployedContract of deployedContracts) {
          contracts[deployedContract.abi.hash] = deployedContract;
        }
      } catch {
        connectionState = "connecting";
      }
      for (const nefFile of this.contractDetector.contracts) {
        try {
          const manifest = await NeoExpressIo.contractGet(
            this.neoExpress,
            this.blockchainIdentifier,
            nefFile
          );
          connectionState = "ok";
          const nefFileRelativePath = path.relative(baseHref, nefFile);
          if (manifest) {
            contracts[nefFileRelativePath] = manifest;
            nefHints[manifest.abi.hash] = nefHints[manifest.abi.hash] || {};
            nefHints[manifest.abi.hash][nefFileRelativePath] = true;
            nefHints[manifest.abi.hash][nefFile] = true;
          }
        } catch {
          connectionState = "connecting";
        }
      }
      for (const nefFile of this.viewState.fileContents
        .filter((_) => !_.contract?.startsWith("0x"))
        .map((_) => path.join(baseHref, _.contract || ""))) {
        try {
          const manifest = await NeoExpressIo.contractGet(
            this.neoExpress,
            this.blockchainIdentifier,
            nefFile
          );
          connectionState = "ok";
          if (manifest) {
            contracts[nefFile] = manifest;
            nefHints[manifest.abi.hash] = nefHints[manifest.abi.hash] || [];
            nefHints[manifest.abi.hash][nefFile] = true;
          }
        } catch {
          connectionState = "connecting";
        }
      }
    }
    if (this.rpcClient) {
      for (const contractHash of this.viewState.fileContents
        .filter((_) => _.contract?.startsWith("0x"))
        .map((_) => _.contract || "")) {
        try {
          const manifest = (
            await this.rpcClient.getContractState(contractHash)
          ).toJson();
          connectionState = "ok";
          contracts[contractHash] = manifest;
        } catch {
          connectionState = "connecting";
        }
      }
    }
    this.updateViewState({
      connectionState,
      contracts,
      nefHints,
      addressSuggestions,
    });
  }

  private async onFileUpdate() {
    if (this.isClosed) {
      return;
    }
    try {
      let fileText = this.document.getText();
      if (fileText?.trim().length === 0) {
        fileText = "[]";
      }
      try {
        this.updateViewState({
          fileContents: JSON.parse(fileText),
          errorText: "",
        });
      } catch {
        this.updateViewState({
          errorText: `There was a problem parsing "${path.basename(
            this.document.uri.fsPath
          )}", try opening the file using the built-in editor and confirm that it contains valid JSON.`,
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
