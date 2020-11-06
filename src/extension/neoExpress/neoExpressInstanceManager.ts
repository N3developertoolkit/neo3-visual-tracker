import * as vscode from "vscode";

import BlockchainIdentifier from "../blockchainIdentifier";
import NeoExpress from "./neoExpress";

const LOG_PREFIX = "[NeoExpressInstanceManager]";

export default class NeoExpressInstanceManager {
  private running: BlockchainIdentifier | null;

  private terminals: vscode.Terminal[];

  constructor() {
    this.running = null;
    this.terminals = [];
  }

  dispose() {}

  async run(neoExpress: NeoExpress, identifer: BlockchainIdentifier) {
    if (identifer.blockchainType !== "express") {
      return;
    }

    if (this.running?.name === identifer.name) {
      return;
    }

    await this.stop();

    const children = identifer.getChildren();
    if (children.length) {
      for (const child of children) {
        const terminal = neoExpress.runInTerminal(
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
      const terminal = neoExpress.runInTerminal(
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
    }
  }
}
