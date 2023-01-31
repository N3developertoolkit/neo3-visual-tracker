import * as vscode from "vscode";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";
import Log from "../util/log";
import { findPackage, DotNetPackage, VersionMatchCriteria, PackageLocation, locationString } from "./dotnetToolPackage";
import { installCommand, updateCommand } from "./dotNetToolCommand";
import { getIncludeBuildServerFeed, getIncludePreviewReleases } from "../util/packageJsonHelper";

export enum UpdateResult {
  notUpdated,
  updated,
  declinedToUpdate,
  noNewVersionFromNuget,
  currentPackageIsNewer,
  declinedToUpdateAndDontAskAgain,
}

const LOG_PREFIX = "NeoExpress";
const DONT_ASK_AGAIN = "Don't ask again";
const NEVER_SHOW_LOCATION_PROMPT_AGAIN_KEY = "neverShowLocationPromptAgain";
const NEVER_SHOW_UPDATE_AGAIN_KEY = "neverShowUpdateAgain";

export default class NeoExpressInstaller {
  readonly name: string;
  readonly version: string;
  readonly rootFolder: string;
  readonly targetPackage: DotNetPackage;
  readonly context: vscode.ExtensionContext;

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

  // forceCheck is used to force a check for installation/updates even if the user has previously declined to updat
  // This is used when the user has manually triggered install from the command palette
  async run(forceCheck: boolean = false): Promise<DotNetPackage | null> {
    let currentPackage = await findPackage(this.targetPackage, VersionMatchCriteria.nameOnly);
    if (currentPackage) {
      const updateOutput = await this.tryUpdate(currentPackage, {
        ...this.targetPackage,
        location: currentPackage.location,
      }, forceCheck);
      if (updateOutput.package) {
        currentPackage = updateOutput.package;
      }
    } else {
      currentPackage = await this.tryInstall(forceCheck);
    }
    return currentPackage;
  }

  async tryInstall(forceCheck: boolean = false): Promise<DotNetPackage | null> {
    let installedPackage: DotNetPackage;
    try {
      const selectedLocation = await this.selectUserPreferredLocation(forceCheck);
      if (selectedLocation === null) {
        return null;
      }
      const newPackageVersion = await this.targetPackage.version.findLatestPatchVersionFromNuget(
        getIncludePreviewReleases(),
        getIncludeBuildServerFeed()
      );
      installedPackage = { ...this.targetPackage, location: selectedLocation, version: newPackageVersion };
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Installing ${this.name} ${installedPackage.version} to ${locationString(selectedLocation)}`,
        },
        async () => {
          await installCommand(this.rootFolder, installedPackage, getIncludeBuildServerFeed());
          vscode.window.showInformationMessage(
            `${this.name} installed to ${locationString(selectedLocation)} successfully.`
          );
          return true;
        }
      );
      return installedPackage;
    } catch (error) {
      Log.log(LOG_PREFIX, `Failed to install ${this.name}. ${error}`);
      vscode.window.showErrorMessage(`Failed to install ${this.name}. ${error}`);
      return null;
    }
  }

  async tryUpdate(
    current: DotNetPackage,
    target: DotNetPackage,
    forceCheck: boolean = false
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
      this.context.workspaceState.update(NEVER_SHOW_UPDATE_AGAIN_KEY, false);
    }
    let neverShowAgain = this.context.workspaceState.get<boolean>(NEVER_SHOW_UPDATE_AGAIN_KEY);
    if (neverShowAgain && !forceCheck) {
      return { updateResult: UpdateResult.declinedToUpdate, package: current };
    }
    return await this.handlePatchUpdate(current, target);
  }

  private async selectUserPreferredLocation(forceCheck:boolean = false): Promise<PackageLocation | null> {
    const neverShowAgain = this.context.workspaceState.get<boolean>(NEVER_SHOW_LOCATION_PROMPT_AGAIN_KEY, false);
    if (neverShowAgain && !forceCheck) {
      return null;
    }
    const moreInfoLink = this.getMoreInfoLink();
    let response = await vscode.window.showInformationMessage(
      `The Neo.Express tool package is not installed. Would you like to install it? ${moreInfoLink.value}`,
      "Local",
      "Global",
      DONT_ASK_AGAIN
    );
    let preferredLocation = null;
    if (response === "Local") {
      preferredLocation = PackageLocation.local;
      Log.log(LOG_PREFIX, `User selected local to install ${this.name}`);
    } else if (response === "Global") {
      preferredLocation = PackageLocation.global;
      Log.log(LOG_PREFIX, `User selected global to install ${this.name}`);
    } else if (response === DONT_ASK_AGAIN) {
      this.context.workspaceState.update(NEVER_SHOW_LOCATION_PROMPT_AGAIN_KEY, true);
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
    const newPackageVersion = await target.version.findLatestPatchVersionFromNuget(
      getIncludePreviewReleases(),
      getIncludeBuildServerFeed()
    );
    if (current.version.compare(newPackageVersion) >= 0) {
      return { updateResult: UpdateResult.noNewVersionFromNuget, package: updatedPackage };
    }
    // handle update to new version
    const moreInfoLink = this.getMoreInfoLink();
    const selection = await vscode.window.showInformationMessage(
      `Version ${newPackageVersion.toString()} is available. Do you want to update ${locationString(
        current.location
      )} to the new version? ${moreInfoLink.value}`,
      "Yes",
      "No",
      DONT_ASK_AGAIN
    );
    if (selection === "Yes") {
      try {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Updating ${this.name} ${newPackageVersion} at ${locationString(updatedPackage.location)}`,
          },
          async () => {
            await updateCommand(
              this.rootFolder,
              {
                ...target,
                version: newPackageVersion,
              },
              getIncludeBuildServerFeed()
            );
            updateResult = UpdateResult.updated;
            // @ts-ignore updatedPackage is already initialized
            updatedPackage.version = newPackageVersion;
            vscode.window.showInformationMessage(
              `Successfully updated ${updatedPackage.name} at ${locationString(updatedPackage.location)} to ${
                updatedPackage.version
              }`
            );
            return true;
          }
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
    } else if (selection === DONT_ASK_AGAIN) {
      updateResult = UpdateResult.declinedToUpdateAndDontAskAgain;
      this.context.workspaceState.update(NEVER_SHOW_UPDATE_AGAIN_KEY, true);
    }
    return { updateResult, package: updatedPackage };
  }

  private getMoreInfoLink() {
    const moreInfoLink = new vscode.MarkdownString(
      `[More information](https://github.com/neo-project/neo-express/blob/master/docs/installation.md)`
    );
    moreInfoLink.isTrusted = true;
    return moreInfoLink;
  }
}
