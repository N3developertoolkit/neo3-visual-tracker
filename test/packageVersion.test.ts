import PackageVersion from "../src/extension/neoExpress/packageVersion";

describe("Package version", () => {
  it("Can check if two versions are equal", () => {
    const version1 = new PackageVersion(1, 2, 1);
    const version2 = new PackageVersion(1, 2, 1);
    const version3 = new PackageVersion(2, 3, 3);
    expect(version1.equals(version2)).toBe(true);
    expect(version1.equals(version3)).toBe(false);
  });

  it("Can compare two versions", () => {
    const version1 = new PackageVersion(1, 2, 1);
    const version2 = new PackageVersion(1, 3, 4);
    const version3 = new PackageVersion(2, 3, 0);
    const version4 = new PackageVersion(2, 3, 0);
    expect(version1.compare(version2)).toBeLessThan(0);
    expect(version1.compare(version3)).toBeLessThan(0);
    expect(version2.compare(version3)).toBeLessThan(0);
    expect(version3.compare(version4)).toBe(0);
  });

  it("Can parse string version", () => {
    const version1 = PackageVersion.parse("1.2.1");
    expect(version1.major === 1 && version1.minor === 2 && version1.patch === 1).toBe(true);
    expect(version1.toString()).toBe("1.2.1");
  });

  it("Can find the latest patch version from nuget", async () => {
    const version1 = PackageVersion.parse("3.1.0");
    const latest = await version1.findLatestPatchVersionFromNuget();
    expect(latest.equals(PackageVersion.parse("3.1.46"))).toBe(true);
  });

  it("Can check if target version is a new major or minor version", async () => {
    const version1 = PackageVersion.parse("3.1.3");
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 2, 0))).toBe(true);
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(4, 2, 0))).toBe(true);
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 1, 1))).toBe(false);
  });
});
