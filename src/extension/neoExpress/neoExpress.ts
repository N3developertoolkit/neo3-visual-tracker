import * as childProcess from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import * as which from "which";

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
  private readonly dotnetPath: string;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.binaryPath = path.join(
      this.context.extensionPath,
      "deps",
      "nxp",
      "tools",
      "netcoreapp3.1",
      "any",
      "nxp3.dll"
    );
    this.dotnetPath = which.sync("dotnet", { nothrow: true }) || "dotnet";
  }

  runInTerminal(name: string, command: Command, ...options: string[]) {
    if (!this.checkForDotNet()) {
      return null;
    }
    const dotNetArguments = [this.binaryPath, command, ...options];
    const terminal = vscode.window.createTerminal({
      name,
      shellPath: this.dotnetPath,
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
    if (!this.checkForDotNet()) {
      return { message: "Could not launch Neo Express", isError: true };
    }
    const dotNetArguments = [this.binaryPath, command, ...options];
    try {
      return {
        message: childProcess
          .execFileSync(this.dotnetPath, dotNetArguments)
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

  private async checkForDotNet() {
    let ok = false;
    try {
      ok =
        parseInt(
          childProcess.execFileSync(this.dotnetPath, ["--version"]).toString()
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
