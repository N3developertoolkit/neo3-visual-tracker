import * as vscode from "vscode";

import AutoComplete from "../autoComplete";
import Log from "../../shared/log";
import posixPath from "../util/posixPath";

const LOG_PREFIX = "ContractsTreeDataProvider";

type ContractData = {
  description: string;
  hash: string;
  name: string;
  nefInWorkspace: boolean;
};

export default class ContractsTreeDataProvider
  implements vscode.TreeDataProvider<ContractData> {
  onDidChangeTreeData: vscode.Event<void>;

  private readonly onDidChangeTreeDataEmitter: vscode.EventEmitter<void>;

  private contracts: ContractData[] = [];

  constructor(
    private readonly extensionPath: string,
    private readonly autoComplete: AutoComplete
  ) {
    this.onDidChangeTreeDataEmitter = new vscode.EventEmitter<void>();
    this.onDidChangeTreeData = this.onDidChangeTreeDataEmitter.event;
    autoComplete.onChange(() => this.refresh());
  }

  getTreeItem(contract: ContractData): vscode.TreeItem {
    return {
      command: {
        command: "neo3-visual-devtracker.tracker.openContract",
        arguments: [{ hash: contract.hash }],
        title: contract.hash,
      },
      label: contract.name,
      tooltip: `${contract.hash}\n${contract.description || ""}`.trim(),
      description: contract.description,
      iconPath: contract.nefInWorkspace
        ? posixPath(this.extensionPath, "resources", "blockchain-express.svg")
        : posixPath(this.extensionPath, "resources", "blockchain-private.svg"),
    };
  }

  getChildren(contractHash?: ContractData): ContractData[] {
    return contractHash ? [] : this.contracts;
  }

  refresh() {
    Log.log(LOG_PREFIX, "Refreshing contract list");
    const newData: ContractData[] = [];
    for (const hash of Object.keys(this.autoComplete.data.contractNames)) {
      const name = this.autoComplete.data.contractNames[hash] || hash;
      const manifest = this.autoComplete.data.contractManifests[hash] || {};
      const description =
        ((manifest.extra || {}) as any)["Description"] || undefined;
      const nefInWorkspace =
        !!this.autoComplete.data.contractPaths[hash] ||
        !!this.autoComplete.data.contractPaths[name];
      newData.push({ hash, name, description, nefInWorkspace });
    }
    newData.sort((a, b) => a.name.localeCompare(b.name));
    this.contracts = newData;
    this.onDidChangeTreeDataEmitter.fire();
  }
}
