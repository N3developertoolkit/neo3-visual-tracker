import * as vscode from "vscode";

import ActiveConnection from "../activeConnection";
import BlockchainIdentifier from "../blockchainIdentifier";
import IoHelpers from "../ioHelpers";
import NeoExpress from "./neoExpress";

const LOG_PREFIX = "[NeoExpressInstanceManager]";
const REFRESH_INTERVAL_MS = 1000 * 5;

export default class NeoExpressInstanceManager {
  onChange: vscode.Event<void>;

  get runningInstance() {
    return this.running;
  }

  private readonly onChangeEmitter: vscode.EventEmitter<void>;

  private disposed: boolean;
  private running: BlockchainIdentifier | null;
  private terminals: vscode.Terminal[];

  constructor(
    private readonly neoExpress: NeoExpress,
    private readonly activeConnection: ActiveConnection
  ) {
    this.disposed = false;
    this.running = null;
    this.terminals = [];
    this.onChangeEmitter = new vscode.EventEmitter<void>();
    this.onChange = this.onChangeEmitter.event;
    this.activeConnection.onChange(async (blockchainIdentifier) => {
      if (
        blockchainIdentifier &&
        blockchainIdentifier.blockchainType === "express" &&
        blockchainIdentifier.name !== this.running?.name
      ) {
        if (
          await IoHelpers.yesNo(
            `${blockchainIdentifier.name} is not running. Would you like to start it?`
          )
        ) {
          await this.run(blockchainIdentifier);
        }
      }
    });
    this.refreshLoop();
  }

  dispose() {
    this.disposed = true;
  }

  async run(identifer: BlockchainIdentifier) {
    if (identifer.blockchainType !== "express") {
      return;
    }

    const runningPreviously = this.running;
    await this.stop();

    if (
      this.activeConnection.connection?.blockchainIdentifier.name ===
      runningPreviously?.name
    ) {
      await this.activeConnection.disconnect(true);
    }

    const children = identifer.getChildren();
    if (children.length) {
      for (const child of children) {
        const terminal = this.neoExpress.runInTerminal(
          child.name,
          "run",
          "-i",
          child.configPath,
          "-s",
          "15",
          `${child.index}`
        );
        if (terminal) {
          this.terminals.push(terminal);
        }
      }
    } else {
      const terminal = this.neoExpress.runInTerminal(
        identifer.name,
        "run",
        "-i",
        identifer.configPath,
        "-s",
        "15",
        `${identifer.index}`
      );
      if (terminal) {
        this.terminals.push(terminal);
      }
    }

    this.running = identifer;

    if (!this.activeConnection.connection?.healthy) {
      await this.activeConnection.connect(identifer);
    }

    this.onChangeEmitter.fire();
  }

  async stop() {
    try {
      for (const terminal of this.terminals) {
        if (!terminal.exitStatus) {
          terminal.dispose();
        }
      }
    } catch (e) {
      console.warn(
        LOG_PREFIX,
        "Could not stop",
        this.running?.name || "unknown",
        e.message
      );
    } finally {
      this.terminals = [];
      this.running = null;
      this.onChangeEmitter.fire();
    }
  }

  private async checkTerminals() {
    if (this.terminals.length > 0) {
      this.terminals = this.terminals.filter((_) => _.exitStatus === undefined);
      if (this.terminals.length === 0 && this.running) {
        this.running = null;
        this.onChangeEmitter.fire();
      }
    }
  }

  private async refreshLoop() {
    if (this.disposed) {
      return;
    }
    try {
      await this.checkTerminals();
    } finally {
      setTimeout(() => this.refreshLoop(), REFRESH_INTERVAL_MS);
    }
  }
}
