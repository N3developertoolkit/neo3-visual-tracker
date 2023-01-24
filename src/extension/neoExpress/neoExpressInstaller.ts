import * as child_process from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";
import posixPath from "../util/posixPath";
import Log from "../util/log";
import { findPackage, DotNetPackage, VersionMatchCriteria, PackageLocation } from "./dotnetToolPackage";
import { runCommand } from "./dotNetToolCommand";

export enum UpdateResult {
  notUpdated,
  updated,
  declinedToUpdate,
  noNewVersionFromNuget,
  currentPackageIsNewer,
}

const LOG_PREFIX = "NeoExpress";

export default class NeoExpressInstaller {
  name: string;
  version: string;
  rootFolder: string;
  preferredLocation: PackageLocation;
  targetPackage: DotNetPackage;

  constructor(version: string) {
    this.name = "neo.express";
    this.version = version;
    this.targetPackage = {
      name: this.name,
      version: PackageVersion.parse(this.version),
    };
    this.rootFolder = workspaceFolder() || process.cwd();
    this.preferredLocation = PackageLocation.local;
  }

  async tryInstall(): Promise<DotNetPackage | null> {
    let currentPackage = await findPackage(this.targetPackage, VersionMatchCriteria.ignorePatch);
    if (currentPackage) {
      Log.log(
        LOG_PREFIX,
        `Already have ${currentPackage.name} with the correct version ${currentPackage.version.toString()}. ${
          currentPackage.location
        }.`
      );
      Log.log(LOG_PREFIX, `Offer to update ${currentPackage.name} if new version is available from nuget`);
      const updateOutput = await this.tryUpdateToLatest(this.rootFolder, currentPackage, {
        ...this.targetPackage,
        location: this.preferredLocation,
      });
      if (updateOutput.package) {
        currentPackage = updateOutput.package;
      }
    } else {
      const selected = await this.selectUserPreferredLocation();
      if (!selected) {
        Log.log(LOG_PREFIX, `No package found but user declined to install ${this.name}. No action taken.`);
        return null;
      }
      Log.log(LOG_PREFIX, `User selected ${this.preferredLocation} to install ${this.name}`);
      currentPackage = await this.installNew({
        ...this.targetPackage,
        location: this.preferredLocation,
      });
    }
    return currentPackage;
  }

  async selectUserPreferredLocation(): Promise<boolean> {
    let response = await vscode.window.showInformationMessage(
      `${this.name} ${this.version} is required. Where would you like to install it?`,
      "Local",
      "Global",
      "More info"
    );

    if (response === "Local") {
      this.preferredLocation = PackageLocation.local;
    } else if (response === "Global") {
      this.preferredLocation = PackageLocation.global;
    } else if (response === "More info") {
      await vscode.env.openExternal(vscode.Uri.parse("https://dotnet.microsoft.com/download"));
    }
    return response === undefined || response === "More info" ? false : true;
  }

  async installNew(tool: DotNetPackage): Promise<DotNetPackage | null> {
    try {
      const newPackageVersion = await tool.version.latestPackageVersionFromNuget();
      let newPackage = { name: tool.name, version: newPackageVersion, location: tool.location };
      if (tool.location === PackageLocation.global) {
        const output = await runCommand(
          `dotnet tool install --global ${tool.name} --version ${newPackageVersion}`,
          this.rootFolder
        );
        Log.log(LOG_PREFIX, `Install global tool ${tool.name}`);
        Log.log(LOG_PREFIX, output);
      } else {
        let message;
        if (!fs.existsSync(posixPath(this.rootFolder, ".config", "dotnet-tools.json"))) {
          message = await runCommand(`dotnet new tool-manifest`, this.rootFolder);
          Log.log(LOG_PREFIX, `Create new manifest file ${message}`);
        }
        message = await runCommand(
          `dotnet tool install --local ${tool.name} --version ${newPackageVersion}`,
          this.rootFolder
        );
        Log.log(LOG_PREFIX, `Install local tool ${tool.name}`);
        Log.log(LOG_PREFIX, message);
      }
      vscode.window.showInformationMessage(
        `${this.name} installed to ${tool.location === PackageLocation.local ? "local" : "global"} successfully.`
      );
      return newPackage;
    } catch (error) {
      console.error(`error: ${error}`);
      return null;
    }
  }

  async tryUpdateToLatest(
    path: string,
    current: DotNetPackage,
    target: DotNetPackage
  ): Promise<{ updateResult: UpdateResult; package: DotNetPackage | null }> {
    const versionCompareResult = current.version.compare(target.version);
    let updateResult = UpdateResult.notUpdated;
    let updatedPackage: DotNetPackage | null = null;
    // check if current version is older or newer than the target version. no action will be taken if current is already newer
    if (versionCompareResult === 0 || versionCompareResult === -1) {
      const newPackageVersion = await current.version.latestPackageVersionFromNuget();
      const location = current.location === PackageLocation.local ? "local" : "global";
      updatedPackage = current;
      // check if there is a new matching update from nuget
      if (newPackageVersion.compare(current.version) < 0) {
        await vscode.window
          .showInformationMessage(
            `Version ${newPackageVersion.toString()} is available. Do you want to update ${location} to the new version?`,
            "Yes",
            "No"
          )
          .then(async (selection) => {
            if (selection?.toLocaleLowerCase() === "yes") {
              await this.update(path || process.cwd(), {
                ...target,
                version: newPackageVersion,
              });
              updateResult = UpdateResult.updated;
              // @ts-ignore updatedPackage is already initialized
              updatedPackage.version = newPackageVersion;
            } else {
              updateResult = UpdateResult.declinedToUpdate;
            }
          });
        return { updateResult, package: updatedPackage };
      } else {
        updateResult = UpdateResult.noNewVersionFromNuget;
      }
    } else {
      updateResult = UpdateResult.currentPackageIsNewer;
      vscode.window.showInformationMessage(
        `The ${this.name} on your box is newer version than the required. Please consider updating the extension to the latest version.`
      );
    }
    return { updateResult, package: updatedPackage };
  }

  async update(path: string, tool: DotNetPackage): Promise<boolean> {
    try {
      const version = tool.version.toString();
      const locationSwitch = tool.location === PackageLocation.local ? "--local" : "--global";
      await runCommand(`dotnet tool update ${locationSwitch} ${tool.name} --version ${version}`, path);
      return true;
    } catch (error) {
      console.error(`error: ${error}`);
      return false;
    }
  }
}
