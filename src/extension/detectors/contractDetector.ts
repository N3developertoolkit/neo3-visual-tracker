import * as vscode from "vscode";

const LOG_PREFIX = "[ContractDetector]";
const SEARCH_PATTERN = "**/*.nef";

export default class ContractDetector {
  private readonly fileSystemWatcher: vscode.FileSystemWatcher;

  private allContractFiles: string[] = [];

  get contracts() {
    return [...this.allContractFiles];
  }

  constructor() {
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

  async refresh() {
    console.log(LOG_PREFIX, "Refreshing contract list...");
    this.allContractFiles = (
      await vscode.workspace.findFiles(SEARCH_PATTERN)
    ).map((_) => _.fsPath);
  }
}
