import { ExtensionContext } from "vscode";

export function getPackageVersion(context: ExtensionContext): string {
  if(process.env.NEO3_VISUAL_TRACKER_VERSION) {
    return process.env.NEO3_VISUAL_TRACKER_VERSION;
  }
  return "3.5.20"//context.extension.packageJSON.version;
}
  