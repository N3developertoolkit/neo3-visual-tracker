import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const LOG_PREFIX = "[BlockchainIdentifier]";

export default class BlockchainIdentifier {
  static testNet = new BlockchainIdentifier(
    "remote",
    "parent",
    "Neo 3 TestNet",
    ["http://seed1t.neo.org:20332"],
    0,
    "",
    []
  );

  static fromNeoExpressConfig(
    configPath: string
  ): BlockchainIdentifier | undefined {
    try {
      const neoExpressConfig = JSON.parse(
        fs.readFileSync(configPath).toString()
      );
      const nodePorts = neoExpressConfig["consensus-nodes"]
        ?.map((_: any) => parseInt(_["rpc-port"]))
        .filter((_: any) => !!_);
      if (!nodePorts.length) {
        console.log(LOG_PREFIX, "No RPC ports found", configPath);
        return undefined;
      }
      return new BlockchainIdentifier(
        "runnable",
        "parent",
        path.basename(configPath),
        nodePorts.map((_: number) => `http://127.0.0.1:${_}`),
        0,
        configPath,
        neoExpressConfig["wallets"]
          .map((_: any) => _.name)
          .filter((_: string) => !!_)
      );
    } catch (e) {
      console.log(
        LOG_PREFIX,
        "Error parsing neo-express config",
        configPath,
        e.message
      );
      return undefined;
    }
  }

  private constructor(
    public readonly context: "runnable" | "remote",
    public readonly nodeType: "parent" | "child",
    public readonly name: string,
    public readonly rpcUrls: string[],
    public readonly index: number,
    public readonly configPath: string,
    public readonly wallets: string[]
  ) {}

  getChildren() {
    if (this.nodeType === "parent") {
      return this.rpcUrls.map(
        (_, i) =>
          new BlockchainIdentifier(
            this.context,
            "child",
            `${this.name}:${i}`,
            [_],
            i,
            this.configPath,
            this.wallets
          )
      );
    } else {
      return [];
    }
  }

  getTreeItem() {
    if (this.nodeType === "parent") {
      const treeItem = new vscode.TreeItem(
        this.name,
        vscode.TreeItemCollapsibleState.Expanded
      );
      treeItem.contextValue = this.context;
      return treeItem;
    } else {
      const treeItem = new vscode.TreeItem(
        this.rpcUrls[0],
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.contextValue = this.context;
      return treeItem;
    }
  }
}
