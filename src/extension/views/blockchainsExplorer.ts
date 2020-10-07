import * as vscode from "vscode";

import BlockchainIdentifier from "./blockchainIdentifier";
import BlockchainType from "./blockchainType";
import IoHelpers from "../ioHelpers";
import NeoExpressDetector from "../detectors/neoExpressDetector";

const LOG_PREFIX = "[BlockchainsExplorer]";

export default class BlockchainsExplorer
  implements vscode.TreeDataProvider<BlockchainIdentifier> {
  onDidChangeTreeData: vscode.Event<void>;

  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<void>;

  private rootElements: BlockchainIdentifier[] = [];

  static async create(neoExpressDetector: NeoExpressDetector) {
    const blockchainsExplorer = new BlockchainsExplorer(neoExpressDetector);
    await blockchainsExplorer.refresh();
    return blockchainsExplorer;
  }

  private constructor(private readonly neoExpressDetector: NeoExpressDetector) {
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    neoExpressDetector.onChange(() => this.refresh());
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
    const allConfigFiles = this.neoExpressDetector.neoExpressFiles;
    const neoExpressEntries = allConfigFiles
      .map((_) => BlockchainIdentifier.fromNeoExpressConfig(_))
      .filter((_) => !!_) as BlockchainIdentifier[];
    this.rootElements = [BlockchainIdentifier.testNet, ...neoExpressEntries];
    this.onDidChangeTreeDataEmitter.fire();
  }

  async select(
    blockchainTypeFilter?: BlockchainType
  ): Promise<BlockchainIdentifier | undefined> {
    const candidates = this.rootElements.filter(
      (_) => !blockchainTypeFilter || _.blockchainType === blockchainTypeFilter
    );
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
