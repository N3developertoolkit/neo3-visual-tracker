import { findPackage, findPackageByLocation, locationString } from "../src/extension/neoExpress/dotnetToolPackage";
import PackageVersion from "../src/extension/neoExpress/packageVersion";
import { PackageLocation, VersionMatchCriteria } from "../src/extension/neoExpress/dotnetToolPackage";
import { listPackages } from "../src/extension/neoExpress/dotNetToolCommand";

jest.mock("../src/extension/neoExpress/dotNetToolCommand");
const targetPackage = { name: "abc", version: new PackageVersion(3, 1, 3) };

describe("Dotnet tool package functions", () => {
  it("Should return local package if name match is found", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValue([{ ...targetPackage, version: new PackageVersion(13, 11, 12) }]);

    const dotnetPackage = await findPackageByLocation(
      targetPackage,
      VersionMatchCriteria.nameOnly,
      PackageLocation.local
    );
    expect(dotnetPackage).not.toBeNull();
    expect(dotnetPackage?.version.equals(targetPackage.version)).not.toBe(true);
    expect(dotnetPackage?.name).toBe(targetPackage.name);

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
  });

  it("Should return local package if exact match is found", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValue([targetPackage, { ...targetPackage, version: new PackageVersion(3, 1, 2) }]);

    const dotnetPackage = await findPackageByLocation(targetPackage, VersionMatchCriteria.exact, PackageLocation.local);
    expect(dotnetPackage).not.toBeNull();
    expect(dotnetPackage?.version.equals(targetPackage.version)).toBe(true);

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
  });

  it("Should return null if exact match is not found", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValue([targetPackage, { ...targetPackage, version: new PackageVersion(3, 1, 2) }]);

    const dotnetPackage = await findPackageByLocation(
      { ...targetPackage, version: new PackageVersion(4, 0, 0) },
      VersionMatchCriteria.exact,
      PackageLocation.local
    );
    expect(dotnetPackage).toBeNull();

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
  });

  it("findPackage should return local first", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValue([targetPackage, { ...targetPackage, version: new PackageVersion(3, 1, 2) }]);

    const dotnetPackage = await findPackage(targetPackage, VersionMatchCriteria.exact);
    expect(dotnetPackage).not.toBeNull();
    expect(dotnetPackage?.version.equals(targetPackage.version)).toBe(true);
    expect(dotnetPackage?.location).toBe(PackageLocation.local);

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
  });

  it("findPackage should return global if local does not exist", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValueOnce([]).mockResolvedValueOnce([targetPackage]);

    const dotnetPackage = await findPackage(targetPackage, VersionMatchCriteria.exact);
    expect(dotnetPackage).not.toBeNull();
    expect(dotnetPackage?.version.equals(targetPackage.version)).toBe(true);
    expect(dotnetPackage?.location).toBe(PackageLocation.global);

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
    expect(listPackageMock).toBeCalledWith(PackageLocation.global);
  });

  it("findPackage should return null if neither global nor local can be found", async () => {
    // setup mock
    const listPackageMock = listPackages as jest.MockedFunction<typeof listPackages>;
    listPackageMock.mockResolvedValueOnce([]).mockResolvedValueOnce([targetPackage]);

    const dotnetPackage = await findPackage(
      { ...targetPackage, version: PackageVersion.parse("33.3.3") },
      VersionMatchCriteria.exact
    );
    expect(dotnetPackage).toBeNull();

    // verify mock
    expect(listPackageMock).toBeCalledWith(PackageLocation.local);
    expect(listPackageMock).toBeCalledWith(PackageLocation.global);
  });

  it("should return correct location string", async () => {
    expect(locationString(PackageLocation.local)).toBe("local");
    expect(locationString(PackageLocation.global)).toBe("global");
    expect(locationString(PackageLocation.local, "--")).toBe("--local");
    expect(locationString(PackageLocation.global, "--")).toBe("--global");
  });
});
