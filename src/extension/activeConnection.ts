import * as neonCore from "@cityofzion/neon-core";
import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainsTreeDataProvider from "./providers/blockchainsTreeDataProvider";
import IoHelpers from "./util/ioHelpers";

const LOG_PREFIX = "[ActiveConnection]";
const PREFIX = "NEO:";
const REFRESH_INTERVAL_MS = 1000 * 5;

export default class ActiveConnection {
  connection: {
    blockchainIdentifier: BlockchainIdentifier;
    rpcClient: neonCore.rpc.RPCClient;
    healthy: boolean;
  } | null;

  onChange: vscode.Event<BlockchainIdentifier | null>;

  private readonly onChangeEmitter: vscode.EventEmitter<BlockchainIdentifier | null>;

  private disposed = false;
  private statusBarItem: vscode.StatusBarItem;
  private visible = false;

  constructor(
    private readonly blockchainsTreeDataProvider: BlockchainsTreeDataProvider
  ) {
    this.connection = null;
    this.onChangeEmitter = new vscode.EventEmitter<BlockchainIdentifier | null>();
    this.onChange = this.onChangeEmitter.event;
    this.statusBarItem = vscode.window.createStatusBarItem();
    this.refreshLoop();
  }

  dispose() {
    this.onChangeEmitter.dispose();
    this.statusBarItem.dispose();
    this.disconnect();
    this.disposed = true;
  }

  async connect(blockchainIdentifier?: BlockchainIdentifier) {
    blockchainIdentifier =
      blockchainIdentifier || (await this.blockchainsTreeDataProvider.select());
    let rpcUrl = blockchainIdentifier?.rpcUrls[0];
    if ((blockchainIdentifier?.rpcUrls.length || 0) > 1) {
      rpcUrl = await IoHelpers.multipleChoice(
        "Select an RPC server to connect to",
        ...blockchainIdentifier?.rpcUrls
      );
    }
    if (blockchainIdentifier && rpcUrl) {
      this.connection = {
        blockchainIdentifier,
        rpcClient: new neonCore.rpc.RPCClient(rpcUrl),
        healthy: false,
      };
    } else {
      this.connection = null;
    }
    await this.onChangeEmitter.fire(blockchainIdentifier || null);
    await this.updateConnectionState();
  }

  async disconnect(force?: boolean) {
    if (this.connection) {
      if (
        force ||
        (await IoHelpers.yesNo(
          `Disconnect from ${this.connection.blockchainIdentifier.friendlyName}?`
        ))
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
    const connection = this.connection;
    if (connection) {
      try {
        await connection.rpcClient.getBlockCount();
        connection.healthy = true;
        this.statusBarItem.text = `${PREFIX} Connected to ${connection.blockchainIdentifier.friendlyName}`;
        this.statusBarItem.tooltip = "Click to disconnect";
        this.statusBarItem.color = new vscode.ThemeColor(
          "statusBarItem.prominentForeground"
        );
      } catch {
        connection.healthy = false;
        this.statusBarItem.text = `${PREFIX} Connecting to ${connection.blockchainIdentifier.friendlyName}...`;
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
