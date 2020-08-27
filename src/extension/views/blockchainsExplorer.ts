import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";

export default class BlockchainsExplorer
  implements vscode.TreeDataProvider<BlockchainIdentifier> {
  onDidChangeTreeData: vscode.Event<BlockchainIdentifier>;

  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<
    BlockchainIdentifier
  >;

  constructor() {
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter<
      BlockchainIdentifier
    >();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
  }

  getTreeItem(element: BlockchainIdentifier): vscode.TreeItem {
    return new vscode.TreeItem(element.rpcUrl);
  }

  getChildren(element?: BlockchainIdentifier): BlockchainIdentifier[] {
    if (!element) {
      return [new BlockchainIdentifier("http://seed1t.neo.org:20332")];
    } else {
      // TODO: Child entries
      return [];
    }
  }
}
