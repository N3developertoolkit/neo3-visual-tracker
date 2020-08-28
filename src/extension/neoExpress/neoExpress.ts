import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";

type Command =
  | "checkpoint"
  | "contract"
  | "create"
  | "reset"
  | "run"
  | "show"
  | "transfer"
  | "wallet";

export default class NeoExpress {
  private readonly binaryPath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.binaryPath = path.join(
      this.context.extensionPath,
      "nxp3",
      "tools",
      "netcoreapp",
      "any",
      "nxp3.dll"
    );
  }

  runInTerminal(name: string, command: Command, ...options: string[]) {
    const dotNetArguments = [this.binaryPath, command, ...options];
    const terminal = vscode.window.createTerminal(
      name,
      "dotnet",
      dotNetArguments
    );
    terminal.show();
    return terminal;
  }

  runSync(command: Command, ...options: string[]) {
    const dotNetArguments = [this.binaryPath, command, ...options];
    return childProcess.execFileSync("dotnet", dotNetArguments).toString();
  }
}
