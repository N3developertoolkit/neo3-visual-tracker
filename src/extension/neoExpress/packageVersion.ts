import axios from "axios";

export default class PackageVersion {
  major: number;
  minor: number;
  patch: number;
  constructor(major: number, minor: number, patch: number) {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
  }

  static parse(version: string): PackageVersion {
    const parts = version.split(".");
    if (parts.length !== 3) {
      throw new Error(`Invalid version string: ${version}`);
    }
    return new PackageVersion(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
  }

  async latestPackageVersionFromNuget(): Promise<PackageVersion> {
    let response = await axios.get("https://api.nuget.org/v3-flatcontainer/neo.express/index.json");
    let json = await response.data;
    return this.findLastestVersion(this, json?.versions);
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  equals(other: PackageVersion, ignorePatchVersion: boolean = false) {
    if(ignorePatchVersion){
      return this.compare(other) === 0;
    }
    return this.major === other.major && this.minor === other.minor;
  }

  compare(other: PackageVersion) {
    if (this.major > other.major) {
      return 1;
    } else if (this.major < other.major) {
      return -1;
    } else if (this.minor > other.minor) {
      return 1;
    } else if (this.minor < other.minor) {
      return -1;
    } else if (this.patch > other.patch) {
      return 1;
    } else if (this.patch < other.patch) {
      return -1;
    }
    return 0;
  }

  private findLastestVersion(currentVersion: PackageVersion, targetVersions: [string]): PackageVersion {
    let newVersion = currentVersion;
    targetVersions.forEach((targetVersion) => {
      const target = PackageVersion.parse(targetVersion);
      if (currentVersion.compare(target) < 0) {
        newVersion = target;
      }
    });
    return newVersion;
  }
}
