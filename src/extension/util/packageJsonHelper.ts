import { ExtensionContext } from "vscode";
import * as vscode from "vscode";

export function getTargetNeoExpressVersion(context: ExtensionContext): string {
  const config = vscode.workspace.getConfiguration("neo3-visual-tracker");
  const configValue = config.get<string>("neoExpressVersion");
  return configValue && configValue.length > 0 ? configValue : context.extension.packageJSON.version;
}

export function getIncludePreviewReleases(): boolean {
  const config = vscode.workspace.getConfiguration("neo3-visual-tracker");
  return config.get<boolean>("includePreviewReleases", false);
}

export function getIncludeBuildServerFeed(): boolean {
  const config = vscode.workspace.getConfiguration("neo3-visual-tracker");
  return config.get<boolean>("includeBuildServerFeed", false);
}
