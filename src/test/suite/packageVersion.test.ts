import * as assert from "assert";
import PackageVersion from "../../extension/neoExpress/packageVersion";

test("Can check if two versions are equal", () => {
  const version1 = new PackageVersion(1, 2, 1);
  const version2 = new PackageVersion(1, 2, 1);
  const version3 = new PackageVersion(2, 3, 3);
  assert.ok(version1.equals(version2));
  assert.strictEqual(version1.equals(version3), false);
});

test("Can compare two versions", () => {
  const version1 = new PackageVersion(1, 2, 1);
  const version2 = new PackageVersion(1, 3, 4);
  const version3 = new PackageVersion(2, 3, 0);
  const version4 = new PackageVersion(2, 3, 0);
  assert.ok(version1.compare(version2) < 0);
  assert.ok(version1.compare(version3) < 0);
  assert.ok(version2.compare(version3) < 0);
  assert.ok(version3.compare(version4) === 0);
});

test("Can parse string version", () => {
  const version1 = PackageVersion.parse("1.2.1");
  assert.ok(version1.major === 1 && version1.minor === 2 && version1.patch === 1);
  assert.strictEqual(version1.toString(), "1.2.1");
});

test("Can find the latest patch version from nuget", async () => {
  const version1 = PackageVersion.parse("3.1.0");
  const latest = await version1.findLatestPatchVersionFromNuget();
  assert.ok(latest.equals(PackageVersion.parse("3.1.46")));
});

test("Can check if target version is a new major or minor version", async () => {
  const version1 = PackageVersion.parse("3.1.3");
  assert.strictEqual(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 2, 0)), true);
  assert.strictEqual(version1.isNewMajorOrMinorVersion(new PackageVersion(4, 2, 0)), true);
  assert.strictEqual(version1.isNewMajorOrMinorVersion(new PackageVersion(3, 1, 1)), false);
});
