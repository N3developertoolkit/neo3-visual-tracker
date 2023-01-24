import { listPackages } from "./dotNetToolCommand";
import PackageVersion from "./packageVersion";

export enum PackageLocation {
  local,
  global,
}

export enum VersionMatchCriteria {
  exact,
  ignorePatch,
  nameOnly,
}

export type DotNetPackage = {
  name: string;
  version: PackageVersion;
  location?: PackageLocation;
};

export function locationString(location: PackageLocation | undefined, prefix: string = ""): string {
  return location && location === PackageLocation.global ? `${prefix}global` : `${prefix}local`;
}

export async function findPackage(
  targetPackage: DotNetPackage,
  matchCriteria: VersionMatchCriteria
): Promise<DotNetPackage | null> {
  const localTarget = await findPackageByLocation(targetPackage, matchCriteria, PackageLocation.local);
  if (localTarget) {
    return localTarget;
  }
  const globalTarget = await findPackageByLocation(targetPackage, matchCriteria, PackageLocation.global);
  if (globalTarget) {
    return globalTarget;
  }

  return null;
}

async function findPackageByLocation(
  targetPackage: DotNetPackage,
  matchCriteria: VersionMatchCriteria,
  location: PackageLocation
): Promise<DotNetPackage | null> {
  const output = await listPackages(location);
  let foundPackage = null;
  output.forEach((current: DotNetPackage) => {
    if (current.name !== targetPackage.name) {
      return;
    }
    if (matchCriteria === VersionMatchCriteria.nameOnly) {
      foundPackage = {
        ...current,
        location: location,
        version: current.version,
      };
    } else if (VersionMatchCriteria.ignorePatch || VersionMatchCriteria.exact) {
      if (current.version.equals(targetPackage.version, matchCriteria === VersionMatchCriteria.ignorePatch)) {
        foundPackage = {
          ...current,
          location: location,
          version: current.version,
        };
      }
    }
  });
  return foundPackage;
}
