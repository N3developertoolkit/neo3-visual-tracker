import tryFetchJson from "../util/tryFetchJson";

export default class PackageVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly label: string;
  private allLatestVersions: PackageVersion[] = [];

  constructor(major: number, minor: number, patch: number, label: string = "") {
    this.major = major;
    this.minor = minor;
    this.patch = patch;
    this.label = label;
  }

  static parse(version: string): PackageVersion {
    const parts = version.split(".");
    if (parts.length !== 3) {
      throw new Error(`Invalid version string: ${version}`);
    }
    let patchVersion = parts[2];
    let label = "";
    if (parts[2]?.includes("-")) {
      const withLabel = parts[2]?.split("-");
      patchVersion = withLabel[0];
      label = withLabel[1];
    }

    return new PackageVersion(parseInt(parts[0]), parseInt(parts[1]), parseInt(patchVersion), label);
  }

  async findLatestPatchVersionFromNuget(includesPreview: boolean = false): Promise<PackageVersion> {
    return (
      (await this.getLatestVersionsFromNuget(includesPreview))
        .filter((target) => this.compare(target) < 0 && !this.isNewMajorOrMinorVersion(target))
        .pop() || this
    );
  }

  toString() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }

  equals(other: PackageVersion, ignorePatchVersion: boolean = false) {
    if (ignorePatchVersion) {
      return this.compare(other) === 0;
    }
    return (
      this.major === other.major &&
      this.minor === other.minor &&
      this.label?.toLocaleLowerCase() === other.label?.toLocaleLowerCase()
    );
  }

  isNewMajorOrMinorVersion(other: PackageVersion) {
    return this.compare(other) < 0 && (this.major !== other.major || this.minor !== other.minor);
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

  private async getLatestVersionsFromNuget(includesPreview: boolean = false): Promise<PackageVersion[]> {
    if (this.allLatestVersions.length > 0) {
      return this.allLatestVersions;
    }
    let response = await tryFetchJson("https", "api.nuget.org", "/v3-flatcontainer/neo.express/index.json");
    let all = response?.versions;
    if (!includesPreview) {
      all = all?.filter((v: string) => !v.includes("-"));
    }
    this.allLatestVersions = all.map((version: string) => PackageVersion.parse(version));
    return this.allLatestVersions;
  }
}
