import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainsExplorer from "./views/blockchainsExplorer";
import IoHelpers from "./ioHelpers";

const LOG_PREFIX = "[ActiveConnection]";
const PREFIX = "NEO:";
const REFRESH_INTERVAL_MS = 1000 * 5;

export default class ActiveConnection {
  private connection: {
    blockchainIdentifier: BlockchainIdentifier;
    rpcClient: neonCore.rpc.RPCClient;
  } | null;
  private disposed = false;
  private statusBarItem: vscode.StatusBarItem;
  private visible = false;

  constructor(private readonly blockchainsExplorer: BlockchainsExplorer) {
    this.connection = null;
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.refreshLoop();
  }

  dispose() {
    this.statusBarItem.dispose();
    this.disconnect();
    this.disposed = true;
  }

  async connect() {
    const blockchainIdentifier =
      (await this.blockchainsExplorer.select()) || null;
    let rpcUrl = blockchainIdentifier?.rpcUrls[0];
    if ((blockchainIdentifier?.rpcUrls.length || 0) > 1) {
      rpcUrl = await IoHelpers.multipleChoice(
        "Select an RPC server",
        ...blockchainIdentifier?.rpcUrls
      );
    }
    if (blockchainIdentifier && rpcUrl) {
      this.connection = {
        blockchainIdentifier,
        rpcClient: new neonCore.rpc.RPCClient(rpcUrl),
      };
    } else {
      this.connection = null;
    }
    await this.updateConnectionState();
  }

  async disconnect() {
    if (this.connection) {
      if (
        await IoHelpers.yesNo(
          `Disconnect from ${this.connection.blockchainIdentifier.name}?`
        )
      ) {
        this.connection = null;
        await this.updateConnectionState();
      }
    }
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.updateConnectionState();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }

  private async updateConnectionState() {
    if (this.connection) {
      try {
        await this.connection.rpcClient.getBlockCount();
        this.statusBarItem.text = `${PREFIX} Connected to ${this.connection.blockchainIdentifier.name}`;
        this.statusBarItem.tooltip = "Click to disconnect";
        this.statusBarItem.color = new vscode.ThemeColor(
          "statusBarItem.prominentForeground"
        );
      } catch {
        this.statusBarItem.text = `${PREFIX} Connecting to ${this.connection.blockchainIdentifier.name}...`;
        this.statusBarItem.tooltip =
          "A connection cannot currently be established to the Neo blockchain RPC server";
        this.statusBarItem.color = new vscode.ThemeColor(
          "statusBarItem.remoteForeground"
        );
      }
      this.statusBarItem.command = "neo3-visual-devtracker.disconnect";
    } else {
      this.statusBarItem.text = `${PREFIX} Not connected`;
      this.statusBarItem.tooltip = "Click to connect to a Neo blockchain";
      this.statusBarItem.command = "neo3-visual-devtracker.connect";
      this.statusBarItem.color = new vscode.ThemeColor("statusBar.foreground");
    }
    if (!this.visible) {
      this.statusBarItem.show();
      this.visible = true;
    }
  }
}
