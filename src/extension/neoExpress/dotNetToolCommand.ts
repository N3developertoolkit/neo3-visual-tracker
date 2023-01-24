import * as child_process from "child_process";
import { DotNetPackage, PackageLocation } from "./dotnetToolPackage";
import PackageVersion from "./packageVersion";
import workspaceFolder from "../util/workspaceFolder";

export async function listPackages(
  packageLocation: PackageLocation,
  path: string = workspaceFolder() || process.cwd()
): Promise<DotNetPackage[]> {
  const locationSwitch = packageLocation === PackageLocation.local ? "--local" : "--global";
  const stdout = await runCommand(`dotnet tool list ${locationSwitch}`, path);
  const output = parseDotnetToolListOutput(stdout);
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
