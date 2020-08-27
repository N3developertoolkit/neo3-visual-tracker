import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export default class NeoExpress {
  constructor(private readonly context: vscode.ExtensionContext) {}

  runSync(
    command:
      | "checkpoint"
      | "contract"
      | "create"
      | "reset"
      | "run"
      | "show"
      | "transfer"
      | "wallet",
    options?: string[]
  ) {
    const binaryPath = path.join(
      this.context.extensionPath,
      "nxp3",
      "tools",
      "netcoreapp",
      "any",
      "nxp3.dll"
    );
    options = options || [];
    const dotNetArguments = [binaryPath, command, ...options];
    return childProcess.execFileSync("dotnet", dotNetArguments).toString();
  }
}
