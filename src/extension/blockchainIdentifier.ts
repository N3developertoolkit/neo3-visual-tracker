import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

import BlockchainType from "./blockchainType";

const LOG_PREFIX = "[BlockchainIdentifier]";

export default class BlockchainIdentifier {
  static fromNameAndUrls(
    extensionPath: string,
    name: string,
    rpcUrls: string[],
    isWellKnown: boolean
  ): BlockchainIdentifier {
    return new BlockchainIdentifier(
      extensionPath,
      isWellKnown ? "public" : "private",
      "parent",
      name,
      rpcUrls,
      0,
      "",
      [],
      []
    );
  }

  static fromNeoExpressConfig(
    extensionPath: string,
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
      const wallets: string[] = [];
      const walletAddresses: string[] = [];
      for (const wallet of neoExpressConfig["wallets"]) {
        if (wallet.name) {
          wallets.push(wallet.name);
        }
        for (const account of wallet.accounts || []) {
          if (account["script-hash"]) {
            walletAddresses.push(account["script-hash"]);
          }
        }
      }
      return new BlockchainIdentifier(
        extensionPath,
        "express",
        "parent",
        path.basename(configPath),
        nodePorts.map((_: number) => `http://127.0.0.1:${_}`),
        0,
        configPath,
        wallets,
        walletAddresses
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
    private readonly extensionPath: string,
    public readonly blockchainType: BlockchainType,
    public readonly nodeType: "parent" | "child",
    public readonly name: string,
    public readonly rpcUrls: string[],
    public readonly index: number,
    public readonly configPath: string,
    public readonly wallets: string[],
    public readonly walletAddresses: string[]
  ) {}

  getChildren() {
    if (this.nodeType === "parent") {
      return this.rpcUrls.map(
        (_, i) =>
          new BlockchainIdentifier(
            this.extensionPath,
            this.blockchainType,
            "child",
            `${this.name}:${i}`,
            [_],
            i,
            this.configPath,
            this.wallets,
            this.walletAddresses
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
      treeItem.contextValue = this.blockchainType;
      treeItem.iconPath = vscode.Uri.file(
        path.join(
          this.extensionPath,
          "resources",
          `blockchain-${this.blockchainType}.svg`
        )
      );
      return treeItem;
    } else {
      const treeItem = new vscode.TreeItem(
        this.rpcUrls[0],
        vscode.TreeItemCollapsibleState.None
      );
      treeItem.contextValue = this.blockchainType;
      treeItem.iconPath = vscode.ThemeIcon.File;
      return treeItem;
    }
  }
}
