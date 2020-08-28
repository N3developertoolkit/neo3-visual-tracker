import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

const LOG_PREFIX = "[BlockchainIdentifier]";

export default class BlockchainIdentifier {
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
        "parent",
        path.basename(configPath),
        nodePorts.map((_: number) => `http://127.0.0.1:${_}`)
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

  constructor(
    public readonly nodeType: "parent" | "child",
    public readonly name: string,
    public readonly rpcUrls: string[]
  ) {}

  getChildren() {
    if (this.nodeType === "parent") {
      return this.rpcUrls.map(
        (_) => new BlockchainIdentifier("child", this.name, [_])
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
      return treeItem;
    } else {
      const treeItem = new vscode.TreeItem(
        this.rpcUrls[0],
        vscode.TreeItemCollapsibleState.None
      );
      return treeItem;
    }
  }
}
