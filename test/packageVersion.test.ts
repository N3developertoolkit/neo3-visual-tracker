import PackageVersion from "../src/extension/neoExpress/packageVersion";
import tryFetchJson from "../src/extension/util/tryFetchJson";
jest.mock("../src/extension/util/tryFetchJson");

const NugetResponse = {
  versions: [
    "2.0.1",
    "2.0.17-preview",
    "2.0.18-preview",
    "2.0.21-preview",
    "2.0.22",
    "2.0.23-alpha",
    "3.0.2",
    "3.0.5",
    "3.0.13",
    "3.0.21",
    "3.5.20",
  ],
};

const BuildServerResponse = {
  versions: [
    "3.6.4-preview",
    "3.6.3-preview",
    "3.6.2-preview",
    "3.5.20",
    "3.5.19",
    "3.5.17-preview",
    "3.5.16-preview",
    "3.5.11-preview",
    "3.5.10-preview",
    "3.5.9-preview",
    "3.5.8-preview",
    "3.5.5-preview",
    "3.5.4-preview",
    "3.5.3-preview",
    "3.5.2-preview",
    "3.4.18",
    "3.4.15",
    "3.4.14-preview",
    "3.4.12-preview",
    "3.3.26",
  ],
};
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

  it("Can check if target version is a new major or minor version", async () => {
    const version1 = PackageVersion.parse("3.1.3");
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 2, 0))).toBe(true);
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(4, 2, 0))).toBe(true);
    expect(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 1, 1))).toBe(false);
  });

  it("Can parse package version with additional label ignore case", async () => {
    const version1 = PackageVersion.parse("3.1.3-preview");
    expect(version1.equals(new PackageVersion(3, 1, 3))).toBe(false);
    expect(version1.equals(new PackageVersion(3, 1, 3, "PREview"))).toBe(true);
    expect(version1.label).toBe("preview");
  });

  it("Can compare package versions with additional label", async () => {
    const version1 = PackageVersion.parse("3.1.3-preview");
    expect(new PackageVersion(3, 1, 3, "PREview").compare(new PackageVersion(3, 0, 3))).toBeGreaterThan(0);
    expect(new PackageVersion(3, 1, 3, "PREview").compare(new PackageVersion(3, 0, 3, "alpha"))).toBeGreaterThan(0);
    expect(new PackageVersion(3, 1, 3, "PREview").compare(new PackageVersion(4, 0, 3))).toBeLessThan(0);
    expect(new PackageVersion(3, 1, 3, "PREview").compare(new PackageVersion(3, 6, 3))).toBeLessThan(0);
    expect(new PackageVersion(3, 1, 3, "PREview").compare(new PackageVersion(3, 1, 3))).toBe(0);
  });

  it("Can find the latest patch version from nuget", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValue(NugetResponse);
    const version1 = PackageVersion.parse("3.0.2");
    const latest = await version1.findLatestPatchVersionFromNuget();
    expect(latest.equals(PackageVersion.parse("3.0.21"))).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("Should return itself if it is already the latest patch version from nuget", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValue(NugetResponse);
    const version1 = PackageVersion.parse("3.0.21");
    const latest = await version1.findLatestPatchVersionFromNuget();
    expect(latest.equals(PackageVersion.parse("3.0.21"))).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("Should return itself if there are no versions match from nuget", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValue(NugetResponse);
    const version1 = PackageVersion.parse("13.0.21");
    const latest = await version1.findLatestPatchVersionFromNuget();
    expect(latest.equals(PackageVersion.parse("13.0.21"))).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("Can get latest patch version from nuget with preview label", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValue(NugetResponse);
    expect(
      (await PackageVersion.parse("2.0.1").findLatestPatchVersionFromNuget(true)).equals(
        PackageVersion.parse("2.0.23-alpha")
      )
    ).toBe(true);
    expect(
      (await PackageVersion.parse("2.0.17-preview").findLatestPatchVersionFromNuget(false)).equals(
        PackageVersion.parse("2.0.22")
      )
    ).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("Can get latest patch version from nuget with preview label", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValue(NugetResponse);
    expect(
      (await PackageVersion.parse("2.0.1").findLatestPatchVersionFromNuget(false)).equals(
        PackageVersion.parse("2.0.22")
      )
    ).toBe(true);
    expect(
      (await PackageVersion.parse("2.0.1").findLatestPatchVersionFromNuget(true)).equals(
        PackageVersion.parse("2.0.23-alpha")
      )
    ).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("Can get latest patch version from nuget with preview label plus build server feed", async () => {
    const tryFetchJsonMock = tryFetchJson as jest.MockedFunction<typeof tryFetchJson>;
    tryFetchJsonMock.mockResolvedValueOnce(NugetResponse).mockResolvedValueOnce(BuildServerResponse);
    const latest = await PackageVersion.parse("3.6.2-preview").findLatestPatchVersionFromNuget(true, true);
    expect(latest.equals(PackageVersion.parse("3.6.4-preview"))).toBe(true);
    expect(tryFetchJsonMock).toBeCalled();
  });

  it("To string should include label", async () => {
    expect(PackageVersion.parse("3.6.4-preview").toString()).toBe("3.6.4-preview");
    expect(PackageVersion.parse("3.6.4-previewalpha").toString()).toBe("3.6.4-previewalpha");
    expect(PackageVersion.parse("3.6.4").toString()).toBe("3.6.4");
  });
});
