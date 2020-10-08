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
      "nxp",
      "tools",
      "netcoreapp",
      "any",
      "nxp3.dll"
    );
  }

  runInTerminal(name: string, command: Command, ...options: string[]) {
    const dotNetArguments = [this.binaryPath, command, ...options];
    const terminal = vscode.window.createTerminal({
      name,
      shellPath: "dotnet",
      shellArgs: dotNetArguments,
      hideFromUser: false,
    });
    terminal.show();
    return terminal;
  }

  runSync(
    command: Command,
    ...options: string[]
  ): { message: string; isError?: boolean } {
    const dotNetArguments = [this.binaryPath, command, ...options];
    try {
      return {
        message: childProcess
          .execFileSync("dotnet", dotNetArguments)
          .toString(),
      };
    } catch (e) {
      return {
        isError: true,
        message:
          e.stderr?.toString() ||
          e.stdout?.toString() ||
          e.message ||
          "Unknown failure",
      };
    }
  }
}
