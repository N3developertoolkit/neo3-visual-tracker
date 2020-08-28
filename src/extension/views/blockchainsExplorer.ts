import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import IoHelpers from "../ioHelpers";

const LOG_PREFIX = "[BlockchainsExplorer]";
const SEARCH_PATTERN = "**/*.neo-express";

export default class BlockchainsExplorer
  implements vscode.TreeDataProvider<BlockchainIdentifier> {
  onDidChangeTreeData: vscode.Event<void>;

  private readonly fileSystemWatcher: vscode.FileSystemWatcher;

  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<void>;

  private rootElements: BlockchainIdentifier[] = [];

  static async create() {
    const blockchainsExplorer = new BlockchainsExplorer();
    await blockchainsExplorer.refresh();
    return blockchainsExplorer;
  }

  private constructor() {
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

  async select(context: string): Promise<BlockchainIdentifier | undefined> {
    const candidates = this.rootElements.filter((_) => _.context === context);
    if (!candidates.length) {
      return;
    }
    const selection = await IoHelpers.multipleChoice(
      "Select a blockchain",
      ...candidates.map((_, i) => `${i} - ${_.name}`)
    );
    if (!selection) {
      return;
    }
    const selectedIndex = parseInt(selection);
    return candidates[selectedIndex];
  }
}
