import * as vscode from "vscode";

const LOG_PREFIX = "[DetectorBase]";

export default abstract class DetectorBase {
  private readonly fileSystemWatcher: vscode.FileSystemWatcher;

  private allFiles: string[] = [];

  protected get files() {
    return [...this.allFiles];
  }

  constructor(private readonly searchPattern: string) {
    this.refresh();
    this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
      searchPattern
    );
    this.fileSystemWatcher.onDidChange(this.refresh, this);
    this.fileSystemWatcher.onDidCreate(this.refresh, this);
    this.fileSystemWatcher.onDidDelete(this.refresh, this);
  }

  dispose() {
    this.fileSystemWatcher.dispose();
  }

  async onChange(): Promise<void> {}

  async refresh() {
    console.log(LOG_PREFIX, "Refreshing file list...", this.searchPattern);
    this.allFiles = (await vscode.workspace.findFiles(this.searchPattern)).map(
      (_) => _.fsPath
    );
    await this.onChange();
  }
}
