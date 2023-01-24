import { ExtensionContext } from "vscode";
import * as vscode from "vscode";

export function getPackageVersion(context: ExtensionContext): string {
  if (process.env.NEO3_VISUAL_TRACKER_VERSION) {
    return process.env.NEO3_VISUAL_TRACKER_VERSION;
  }
  return context.extension.packageJSON.version;
}
