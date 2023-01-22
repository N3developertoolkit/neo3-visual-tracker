import * as child_process from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";
import posixPath from "../util/posixPath";

export type Package = {
  name: string;
  version: PackageVersion;
  location?: PackageLocation;
};

export enum PackageLocation {
  local,
  global,
}

export enum UpdateResult {
  notUpdated,
  updated,
  declinedToUpdate,
  noNewVersionFromNuget,
  currentPackageIsNewer,
}

export default class PackageInstaller {
  name: string;
  version: string;
  rootFolder: string;
  preferredLocation: PackageLocation;
  targetPackage: Package;

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
    this.targetPackage = { name: this.name, version: PackageVersion.parse(this.version) };
    this.rootFolder = workspaceFolder() || process.cwd();
    this.preferredLocation = PackageLocation.local;
  }

  async tryInstall() {
    const hasRequired = await this.hasRequiredPacakge();
    if (hasRequired) {
      return;
    }
    const selected = await this.selectUserPreferredLocation();
    if (!selected) {
      return;
    }
    let currentPackage = await this.findPackage(this.rootFolder, this.preferredLocation);
    if (currentPackage) {
      const updateResult = await this.tryUpdateToLatest(this.rootFolder, currentPackage, {
        ...this.targetPackage,
        location: this.preferredLocation,
      });
      if (updateResult === UpdateResult.currentPackageIsNewer) {
        vscode.window.showInformationMessage(
          `The Neo.express on your box is newer version than the required. Please consider updating the extension to the latest version.`
        );
      }
    } else {
      await this.installNew(this.rootFolder, { ...this.targetPackage, location: this.preferredLocation });
    }
  }
  async hasRequiredPacakge(): Promise<boolean> {
    const localPackage = await this.findPackage(this.rootFolder, PackageLocation.local, this.version);
    const globalPackage = await this.findPackage(this.rootFolder, PackageLocation.global, this.version);
    return localPackage || globalPackage ? true : false;
  }

  async selectUserPreferredLocation(): Promise<boolean> {
    const localPackage = await this.findPackage(this.rootFolder, PackageLocation.local);
    const globalPackage = await this.findPackage(this.rootFolder, PackageLocation.global);
    let response: string | undefined;
    if (localPackage && globalPackage) {
      response = await vscode.window.showInformationMessage(
        `Neo.express ${
          this.version
        } is required. We have found version ${localPackage.version.toString()} in local and version ${globalPackage.version.toString()} in global. Which one would you like to use?`,
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
    } else if (!localPackage && !globalPackage) {
      response = await vscode.window.showInformationMessage(
        `Neo.express ${this.version} is required. Where would you like to install it?`,
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
    } else if ((localPackage && !globalPackage) || (!localPackage && globalPackage)) {
      const location = localPackage ? "Local" : "Global";
      const altLocation = localPackage ? "Global" : "Local";
      const version = localPackage?.version || globalPackage?.version;
      const message = `Neo.express ${
        this.version
      } is required. We have found version ${version?.toString()} in ${location}. Would you like to use it or installed in ${altLocation}?`;
      response = await vscode.window.showInformationMessage(message, location, altLocation, "More info");
      if (response === "Local") {
        this.preferredLocation = PackageLocation.local;
      } else if (response === "Global") {
        this.preferredLocation = PackageLocation.global;
      } else if (response === "More info") {
        await vscode.env.openExternal(vscode.Uri.parse("https://dotnet.microsoft.com/download"));
      }
    }
    return response === undefined || response === "More info" ? false : true;
  }

  async installNew(path: string, tool: Package): Promise<boolean> {
    try {
      const newPackage = await tool.version.latestPackageVersionFromNuget();
      const version = newPackage.toString();
      if (tool.location === PackageLocation.global) {
        await this.runCommand(`dotnet tool install --global ${tool.name} --version ${version}`, path);
      } else {
        let message;
        if (!fs.existsSync(posixPath(path, ".config", "dotnet-tools.json"))) {
          message = await this.runCommand(`dotnet new tool-manifest`, path);
        }
        message = await this.runCommand(`dotnet tool install --local ${tool.name} --version ${version}`, path);
      }
      vscode.window.showInformationMessage(
        `Neo.express installed to ${tool.location === PackageLocation.local ? "local" : "global"} successfully.`
      );
      return true;
    } catch (error) {
      console.error(`error: ${error}`);
      return false;
    }
  }

  async tryUpdateToLatest(path: string, current: Package, target: Package): Promise<UpdateResult> {
    const versionCompareResult = current.version.compare(target.version);
    let updateResult = UpdateResult.notUpdated;
    // check if current version is older or newer than the target version. no action will be taken if current is already newer
    if (versionCompareResult === 0 || versionCompareResult === -1) {
      const newPackageVersion = await current.version.latestPackageVersionFromNuget();
      const location = current.location === PackageLocation.local ? "local" : "global";
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
            } else {
              updateResult = UpdateResult.declinedToUpdate;
            }
          });
        return updateResult;
      } else {
        updateResult = UpdateResult.noNewVersionFromNuget;
      }
    } else {
      updateResult = UpdateResult.currentPackageIsNewer;
    }
    return updateResult;
  }

  async update(path: string, tool: Package): Promise<boolean> {
    try {
      const version = tool.version.toString();
      const locationSwitch = tool.location === PackageLocation.local ? "--local" : "--global";
      await this.runCommand(`dotnet tool update ${locationSwitch} ${tool.name} --version ${version}`, path);
      return true;
    } catch (error) {
      console.error(`error: ${error}`);
      return false;
    }
  }

  async findPackage(path: string, location: PackageLocation, version?: string): Promise<Package | null> {
    const locationSwitch = location === PackageLocation.local ? "--local" : "--global";
    const stdout = await this.runCommand(`dotnet tool list ${locationSwitch}`, path);
    const output = this.parseDotnetToolListOutput(stdout);
    let foundPackage = null;
    const hasMatch = output.some((current: Package) => {
      if (current.name === this.name) {
        current.location = location;
        foundPackage = current;
        if (version) {
          const targetVersion = PackageVersion.parse(version);
          return current.version.equals(targetVersion) ? true : false;
        }
        return true;
      }
      return null;
    });
    return hasMatch ? foundPackage : null;
  }

  parseDotnetToolListOutput(output: string): Package[] {
    const tools: Package[] = [];
    const lines = output.split("\n");

    // Iterate over the lines
    for (const line of lines?.slice(2)) {
      if (line?.trim() === "") {
        continue;
      }
      // Split the line into words
      const words = line.split(" ").filter((word) => word !== "");

      // The first word is the tool name
      const name = words[0];

      // Add the tool to the list
      tools.push({ name, version: PackageVersion.parse(words[1]) });
    }

    return tools;
  }

  async runCommand(command: string, path?: string | null): Promise<string> {
    const options: child_process.ExecOptions = {
      cwd: path || process.cwd(),
    };
    return new Promise((resolve, reject) => {
      child_process.exec(command, options, (error: child_process.ExecException | null, stdout: string) => {
        if (error) {
          reject(error);
        }
        resolve(stdout);
      });
    });
  }
}
