import * as child_process from "child_process";
import { DotNetPackage, PackageLocation, locationString } from "./dotnetToolPackage";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";
import Log from "../util/log";
import posixPath from "../util/posixPath";
import * as fs from "fs";

const LOG_PREFIX = "NeoExpress";

export async function listPackages(
  packageLocation: PackageLocation,
  path: string = workspaceFolder() || process.cwd()
): Promise<DotNetPackage[]> {
  let output: DotNetPackage[] = [];
  try {
    const stdout = await runCommand(`dotnet tool list ${locationString(packageLocation, "--")}`, path);
    output = parseDotnetToolListOutput(stdout);
  } catch (error) {
    Log.error(`error: ${error}`);
  }
  return output;
}

export async function updateCommand(path: string, tool: DotNetPackage): Promise<string | null> {
  try {
    const version = tool.version.toString();
    const output = await runCommand(
      `dotnet tool update ${locationString(tool.location, "--")} ${tool.name} --version ${version}`,
      path
    );
    return output;
  } catch (error) {
    Log.error(`error: ${error}`);
  }
  return null;
}

export async function installCommand(path: string, target: DotNetPackage): Promise<string | null> {
  let output = null;
  try {
    if (target.location === PackageLocation.global) {
      output = await runCommand(`dotnet tool install --global ${target.name} --version ${target.version}`, path);
      Log.log(LOG_PREFIX, `Install global tool ${target.name}`);
      Log.log(LOG_PREFIX, output);
    } else {
      if (!fs.existsSync(posixPath(path, ".config", "dotnet-tools.json"))) {
        output = await runCommand(`dotnet new tool-manifest`, path);
        Log.log(LOG_PREFIX, `Create new manifest file ${output}`);
      }
      output = await runCommand(`dotnet tool install --local ${target.name} --version ${target.version}`, path);
      Log.log(LOG_PREFIX, `Install local tool ${target.name}`);
      Log.log(LOG_PREFIX, output);
    }
  } catch (error) {
    Log.error(`error: ${error}`);
  }
  return output;
}

export async function runCommand(command: string, path: string = workspaceFolder() || process.cwd()): Promise<string> {
  const options: child_process.ExecOptions = {
    cwd: path,
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

function parseDotnetToolListOutput(output: string): DotNetPackage[] {
  const tools: DotNetPackage[] = [];
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
