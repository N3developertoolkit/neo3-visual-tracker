import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";

const LOG_PREFIX = "[BlockchainsExplorer]";
const SEARCH_PATTERN = "**/*.neo-express";

export default class BlockchainsExplorer
  implements vscode.TreeDataProvider<BlockchainIdentifier> {
  onDidChangeTreeData: vscode.Event<void>;

  private readonly fileSystemWatcher: vscode.FileSystemWatcher;

  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<void>;

  private rootElements: BlockchainIdentifier[] = [];

  constructor() {
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    this.refresh();
    this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      SEARCH_PATTERN
    );
    this.fileSystemWatcher.onDidChange(this.refresh, this);
    this.fileSystemWatcher.onDidCreate(this.refresh, this);
    this.fileSystemWatcher.onDidDelete(this.refresh, this);
  }

  dispose() {
    this.fileSystemWatcher.dispose();
  }

  getTreeItem(element: BlockchainIdentifier): vscode.TreeItem {
    return element.getTreeItem();
  }

  getChildren(element?: BlockchainIdentifier): BlockchainIdentifier[] {
    if (element) {
      return element.getChildren();
    } else {
      return this.rootElements;
    }
  }

  async refresh() {
    console.log(LOG_PREFIX, "Refreshing tree view...");
    const allConfigFiles = await vscode.workspace.findFiles(SEARCH_PATTERN);
    this.rootElements = allConfigFiles
      .map((_) => BlockchainIdentifier.fromNeoExpressConfig(_.fsPath))
      .filter((_) => !!_) as BlockchainIdentifier[];
    this.onDidChangeTreeDataEmitter.fire();
  }
}
