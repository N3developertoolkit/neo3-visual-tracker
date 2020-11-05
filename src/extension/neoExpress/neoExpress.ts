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

const LOG_PREFIX = "[NeoExpress]";

export default class NeoExpress {
  private readonly binaryPath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.binaryPath = path.join(
      this.context.extensionPath,
      "deps",
      "nxp",
      "tools",
      "netcoreapp",
      "any",
      "nxp3.dll"
    );
  }

  runInTerminal(name: string, command: Command, ...options: string[]) {
    if (!NeoExpress.checkForDotNet()) {
      return null;
    }
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
    if (!NeoExpress.checkForDotNet()) {
      return { message: "Could not launch Neo Express", isError: true };
    }
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

  private static async checkForDotNet() {
    let ok = false;
    try {
      ok =
        parseInt(
          childProcess.execFileSync("dotnet", ["--version"]).toString()
        ) >= 3;
    } catch (e) {
      console.error(LOG_PREFIX, "checkForDotNet error:", e.message);
      ok = false;
    }
    if (!ok) {
      const response = await vscode.window.showErrorMessage(
        ".NET Core 3 or higher is required to use this functionality.",
        "Dismiss",
        "More info"
      );
      if (response === "More info") {
        await vscode.env.openExternal(
          vscode.Uri.parse("https://dotnet.microsoft.com/download")
        );
      }
    }
    return ok;
  }
}
