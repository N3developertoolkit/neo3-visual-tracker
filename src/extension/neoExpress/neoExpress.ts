import * as childProcess from "child_process";
import * as vscode from "vscode";

import Log from "../../shared/log";
import NeoExpressTerminal from "./neoExpressTerminal";
import posixPath from "../util/posixPath";

type Command =
  | "checkpoint"
  | "contract"
  | "create"
  | "reset"
  | "run"
  | "show"
  | "transfer"
  | "wallet"
  | "-v";

const LOG_PREFIX = "NeoExpress";
const TIMEOUT_IN_MS = 5000;
const TIMEOUT_POLLING_INTERVAL_IN_MS = 2000;

async function resolveDotNetPath(): Promise<string> {
  const result = await vscode.commands.executeCommand<any>(
    "dotnet-sdk.acquire",
    {
      version: "5.0",
      requestingExtensionId: "ngd-seattle.neo3-visual-tracker",
    }
  );
  return result?.dotnetPath;
}

export default class NeoExpress {
  private readonly binaryPath: string;
  private readonly dotnetPath: Promise<string>;

  private runLock: boolean;
  private dotNetResolved: boolean;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.binaryPath = posixPath(
      this.context.extensionPath,
      "deps",
      "nxp",
      "tools",
      "net5.0",
      "any",
      "neoxp.dll"
    );
    this.dotNetResolved = false;
    this.dotnetPath = resolveDotNetPath();
    this.dotnetPath.then((_) => (this.dotNetResolved = true));
    this.runLock = false;
  }

  async runInTerminal(name: string, command: Command, ...options: string[]) {
    if (!this.dotNetResolved) {
      // Show .NET SDK download progress, so the user is aware of what they are waiting for...
      await vscode.commands.executeCommand("dotnet-sdk.showAcquisitionLog");
    }
    const dotnetPath = await this.dotnetPath;
    if (!dotnetPath) {
      Log.error(LOG_PREFIX, "dotnet path not found; cannot open terminal");
      return null;
    }
    const dotNetArguments = [this.binaryPath, command, ...options];
    const pty = new NeoExpressTerminal(dotnetPath, dotNetArguments);
    const terminal = vscode.window.createTerminal({ name, pty });

    const hasStarted: Promise<void> = new Promise((resolve) => {
      pty.onDidWrite((data) => {
        if (data.indexOf("Neo express is running") !== -1) {
          resolve();
        }
      });
    });

    terminal.show();

    // Give the terminal a chance to get a lock on the blockchain before
    // starting to do any offline commands.
    await hasStarted;

    return terminal;
  }

  async run(
    command: Command,
    ...options: string[]
  ): Promise<{ message: string; isError?: boolean }> {
    return this.runInternal(false, command, ...options);
  }

  async runInBackground(
    command: Command,
    ...options: string[]
  ): Promise<{ message: string; isError?: boolean }> {
    return this.runInternal(true, command, ...options);
  }

  private async runInternal(
    isBackground: boolean,
    command: Command,
    ...options: string[]
  ): Promise<{ message: string; isError?: boolean }> {
    let durationInternal = 0;
    const startedAtExternal = new Date().getTime();
    const releaseLock = await this.getRunLock();
    try {
      const startedAtInternal = new Date().getTime();
      const result = await this.runUnsafe(isBackground, command, ...options);
      const endedAtInternal = new Date().getTime();
      durationInternal = endedAtInternal - startedAtInternal;
      return result;
    } finally {
      releaseLock();
      const endedAtExternal = new Date().getTime();
      const durationExternal = endedAtExternal - startedAtExternal;
      if (durationExternal > 1000) {
        Log.log(
          LOG_PREFIX,
          `\`neoexp ${command} ${options.join(
            " "
          )}\` took ${durationInternal}ms (${durationExternal}ms including time spent awaiting run-lock)`
        );
      }
    }
  }

  async runUnsafe(
    isBackground: boolean,
    command: string,
    ...options: string[]
  ): Promise<{ message: string; isError?: boolean }> {
    if (!isBackground && !this.dotNetResolved) {
      // Show .NET SDK download progress, so the user is aware of what they are waiting for...
      await vscode.commands.executeCommand("dotnet-sdk.showAcquisitionLog");
    }
    const dotnetPath = await this.dotnetPath;
    if (!dotnetPath) {
      return { message: "Could not launch Neo Express", isError: true };
    }
    const dotNetArguments = [
      this.binaryPath,
      ...command.split(/\s/),
      ...options,
    ];
    try {
      return new Promise((resolve, reject) => {
        const startedAt = new Date().getTime();
        const process = childProcess.spawn(dotnetPath, dotNetArguments);
        let complete = false;
        const watchdog = () => {
          if (!complete && new Date().getTime() - startedAt > TIMEOUT_IN_MS) {
            complete = true;
            try {
              process.kill();
            } catch (e) {
              Log.error(
                LOG_PREFIX,
                `Could not kill timed out neoxp command: ${command} (${e.message})`
              );
            }
            reject("Operation timed out");
          } else if (!complete) {
            setTimeout(watchdog, TIMEOUT_POLLING_INTERVAL_IN_MS);
          }
        };
        watchdog();
        let message = "";
        process.stdout.on(
          "data",
          (d) => (message = `${message}${d.toString()}`)
        );
        process.stderr.on(
          "data",
          (d) => (message = `${message}${d.toString()}`)
        );
        process.on("close", (code) => {
          complete = true;
          resolve({ message, isError: code !== 0 });
        });
        process.on("error", () => {
          complete = true;
          reject();
        });
      });
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

  private async getRunLock(): Promise<() => void> {
    while (this.runLock) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    this.runLock = true;
    return () => {
      this.runLock = false;
    };
  }
}
