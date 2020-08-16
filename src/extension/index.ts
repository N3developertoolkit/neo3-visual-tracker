import * as vscode from "vscode";

import TrackerPanelController from "./panelControllers/trackerPanelController";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("neo3-visual-tracker.helloWorld", () => {
      new TrackerPanelController(context);
    })
  );
}

export function deactivate() {}
