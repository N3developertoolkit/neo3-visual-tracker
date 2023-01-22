import * as child_process from "child_process";
import * as vscode from "vscode";
import * as fs from "fs";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";

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

  constructor(name: string, version: string) {
    this.name = name;
    this.version = version;
  }
  async install() {
    const rootFolder = workspaceFolder() || process.cwd();
    const target: Package = { name: this.name, version: PackageVersion.parse(this.version) };
    const localPackage = await this.findPackage(rootFolder, PackageLocation.local);
    const globalPackage = await this.findPackage(rootFolder, PackageLocation.global);

    let localUpdateResult = UpdateResult.notUpdated;
    let globalUpdateResult = UpdateResult.notUpdated;
    if (localPackage) {
      localUpdateResult = await this.tryUpdateToLatest(rootFolder, localPackage, {
        ...target,
        location: PackageLocation.local,
      });
    }

    if (globalPackage) {
      globalUpdateResult = await this.tryUpdateToLatest(rootFolder, globalPackage, {
        ...target,
        location: PackageLocation.global,
      });
    } else if (
      localUpdateResult === UpdateResult.currentPackageIsNewer ||
      localUpdateResult === UpdateResult.declinedToUpdate
    ) {
      await this.installNew(rootFolder, { ...target, location: PackageLocation.local });
    }

    if (localUpdateResult === UpdateResult.notUpdated && globalUpdateResult === UpdateResult.notUpdated) {
      await this.installNew(rootFolder, { ...target, location: PackageLocation.local });
    }
  }

  async installNew(path: string, tool: Package): Promise<boolean> {
    try {
      const newPackage = await tool.version.latestPackageVersionFromNuget();
      const version = newPackage.toString();
      if (tool.location === PackageLocation.global) {
        await this.runCommand(`dotnet tool install --global ${tool.name} --version ${version}`, path);
      } else {
        let message;
        if (!fs.existsSync(`${path}/.config/dotnet-tools.json`)) {
          message = await this.runCommand(`dotnet new tool-manifest`, path);
        }
        message = await this.runCommand(`dotnet tool install --local ${tool.name} --version ${version}`, path);
      }
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
