import * as vscode from "vscode";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";
import Log from "../util/log";
import { findPackage, DotNetPackage, VersionMatchCriteria, PackageLocation, locationString } from "./dotnetToolPackage";
import { installCommand, updateCommand } from "./dotNetToolCommand";

export enum UpdateResult {
  notUpdated,
  updated,
  declinedToUpdate,
  noNewVersionFromNuget,
  currentPackageIsNewer,
  declinedToUpdateAndDontAskAgain,
}

const LOG_PREFIX = "NeoExpress";

export default class NeoExpressInstaller {
  readonly name: string;
  readonly version: string;
  readonly rootFolder: string;
  readonly targetPackage: DotNetPackage;
  readonly context: vscode.ExtensionContext;
  readonly neverShowAgainKey = "neverShowAgain";

  constructor(context: vscode.ExtensionContext, version: string) {
    this.context = context;
    this.name = "neo.express";
    this.version = version;
    this.targetPackage = {
      name: this.name,
      version: PackageVersion.parse(this.version),
    };
    this.rootFolder = workspaceFolder() || process.cwd();
  }

  async run(): Promise<DotNetPackage | null> {
    let currentPackage = await findPackage(this.targetPackage, VersionMatchCriteria.nameOnly);
    if (currentPackage) {
      const updateOutput = await this.tryUpdate(currentPackage, {
        ...this.targetPackage,
        location: currentPackage.location,
      });
      if (updateOutput.package) {
        currentPackage = updateOutput.package;
      }
    } else {
      currentPackage = await this.tryInstall();
    }
    return currentPackage;
  }

  async tryInstall(): Promise<DotNetPackage | null> {
    let installedPackage = null;
    try {
      const selectedLocation = await this.selectUserPreferredLocation();
      if (selectedLocation === null) {
        return null;
      }
      installedPackage = { ...this.targetPackage, location: selectedLocation };
      await installCommand(this.rootFolder, installedPackage);
      vscode.window.showInformationMessage(
        `${this.name} installed to ${locationString(selectedLocation)} successfully.`
      );
      return installedPackage;
    } catch (error) {
      Log.log(LOG_PREFIX, `Failed to install ${this.name}. ${error}`);
      vscode.window.showErrorMessage(`Failed to install ${this.name}. ${error}`);
      installedPackage = null;
    }
    return installedPackage;
  }

  async tryUpdate(
    current: DotNetPackage,
    target: DotNetPackage
  ): Promise<{ updateResult: UpdateResult; package: DotNetPackage | null }> {
    Log.log(
      LOG_PREFIX,
      `Already have ${current.name} with the correct version ${current.version.toString()}. ${current.location}.`
    );
    Log.log(LOG_PREFIX, `Offer to update ${current.name} if new version is available from nuget`);
    if (current.version.compare(target.version) > 0) {
      vscode.window.showInformationMessage(
        `The ${this.name} ${current.version} on your box is newer version than the required version:${target.version}. Please check if there is a newer extension.`
      );
      return { updateResult: UpdateResult.currentPackageIsNewer, package: current };
    }
    if (current.version.compare(target.version) < 0 && current.version.isNewMajorOrMinorVersion(target.version)) {
      this.context.workspaceState.update(this.neverShowAgainKey, false);
    }
    let neverShowAgain = this.context.workspaceState.get<boolean>(this.neverShowAgainKey);
    if (neverShowAgain) {
      return { updateResult: UpdateResult.declinedToUpdate, package: current };
    }
    return await this.handlePatchUpdate(current, target);
  }

  private async selectUserPreferredLocation(): Promise<PackageLocation | null> {
    const moreInfoLink = new vscode.MarkdownString(`[More information](https://dotnet.microsoft.com/download)`);
    moreInfoLink.isTrusted = true;
    let response = await vscode.window.showInformationMessage(
      `${this.name} ${this.version} is required. Where would you like to install it? ${moreInfoLink.value}`,
      "Local",
      "Global"
    );
    let preferredLocation = null;
    if (response === "Local") {
      preferredLocation = PackageLocation.local;
      Log.log(LOG_PREFIX, `User selected local to install ${this.name}`);
    } else if (response === "Global") {
      preferredLocation = PackageLocation.global;
      Log.log(LOG_PREFIX, `User selected global to install ${this.name}`);
    } else {
      Log.log(LOG_PREFIX, `User declined to install ${this.name}. No action taken.`);
    }
    return preferredLocation;
  }

  private async handlePatchUpdate(
    current: DotNetPackage,
    target: DotNetPackage
  ): Promise<{ updateResult: UpdateResult; package: DotNetPackage | null }> {
    let updatedPackage = current;
    let updateResult = UpdateResult.notUpdated;
    // check if required is newer than current
    const config = vscode.workspace.getConfiguration("neo3-visual-tracker");
    const includePreviewReleases = config.get("includePreviewReleases", false);
    const newPackageVersion = await target.version.findLatestPatchVersionFromNuget(includePreviewReleases);
    if (current.version.compare(newPackageVersion) >= 0) {
      return { updateResult: UpdateResult.noNewVersionFromNuget, package: updatedPackage };
    }
    // handle update to new version
    const moreInfoLink = new vscode.MarkdownString(`[More information](https://dotnet.microsoft.com/download)`);
    moreInfoLink.isTrusted = true;
    const dontAskAgain = "Dont't ask again";
    const selection = await vscode.window.showInformationMessage(
      `Version ${newPackageVersion.toString()} is available. Do you want to update ${locationString(
        current.location
      )} to the new version? ${moreInfoLink.value}`,
      "Yes",
      "No",
      dontAskAgain
    );
    if (selection === "Yes") {
      try {
        await updateCommand(this.rootFolder, {
          ...target,
          version: newPackageVersion,
        });
        updateResult = UpdateResult.updated;
        // @ts-ignore updatedPackage is already initialized
        updatedPackage.version = newPackageVersion;
        await vscode.window.showInformationMessage(
          `Successfully updated ${updatedPackage.name} at ${locationString(updatedPackage.location)} to ${
            updatedPackage.version
          }`
        );
      } catch (error) {
        Log.log(LOG_PREFIX, `Failed to update ${this.name} to ${newPackageVersion.toString()}. ${error}`);
        await vscode.window.showErrorMessage(
          `Failed to update ${this.name} to ${newPackageVersion.toString()}. ${error}`
        );
        updateResult = UpdateResult.notUpdated;
      }
    } else if (selection === "No") {
      updateResult = UpdateResult.declinedToUpdate;
    } else if (selection === dontAskAgain) {
      updateResult = UpdateResult.declinedToUpdateAndDontAskAgain;
      this.context.workspaceState.update(this.neverShowAgainKey, true);
    }
    return { updateResult, package: updatedPackage };
  }
}
