import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  addProfile,
  getProfile,
  listProfiles,
  loadProfiles,
  removeProfile,
  saveProfiles,
  profileFilePath,
  type EnvProfile,
} from "./profile";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-profile-"));
}

const sampleProfile: EnvProfile = {
  name: "myapp",
  contexts: ["local", "staging"],
  baseDir: "/projects/myapp",
  description: "My application profile",
};

describe("profile", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test("loadProfiles returns empty object when file missing", () => {
    expect(loadProfiles(tmpDir)).toEqual({});
  });

  test("saveProfiles and loadProfiles round-trip", () => {
    const map = { myapp: sampleProfile };
    saveProfiles(tmpDir, map);
    expect(loadProfiles(tmpDir)).toEqual(map);
  });

  test("addProfile adds a new profile", () => {
    addProfile(tmpDir, sampleProfile);
    const profiles = loadProfiles(tmpDir);
    expect(profiles["myapp"]).toEqual(sampleProfile);
  });

  test("addProfile overwrites existing profile", () => {
    addProfile(tmpDir, sampleProfile);
    const updated = { ...sampleProfile, description: "Updated" };
    addProfile(tmpDir, updated);
    expect(loadProfiles(tmpDir)["myapp"].description).toBe("Updated");
  });

  test("removeProfile removes an existing profile", () => {
    addProfile(tmpDir, sampleProfile);
    removeProfile(tmpDir, "myapp");
    expect(loadProfiles(tmpDir)).toEqual({});
  });

  test("removeProfile throws for unknown profile", () => {
    expect(() => removeProfile(tmpDir, "ghost")).toThrow('Profile "ghost" not found');
  });

  test("getProfile returns correct profile", () => {
    addProfile(tmpDir, sampleProfile);
    expect(getProfile(tmpDir, "myapp")).toEqual(sampleProfile);
  });

  test("getProfile throws for unknown profile", () => {
    expect(() => getProfile(tmpDir, "ghost")).toThrow('Profile "ghost" not found');
  });

  test("listProfiles returns all profiles as array", () => {
    addProfile(tmpDir, sampleProfile);
    const other: EnvProfile = { name: "other", contexts: ["ci"], baseDir: "/other" };
    addProfile(tmpDir, other);
    const list = listProfiles(tmpDir);
    expect(list).toHaveLength(2);
    expect(list.map((p) => p.name)).toContain("myapp");
    expect(list.map((p) => p.name)).toContain("other");
  });

  test("profileFilePath returns correct path", () => {
    expect(profileFilePath("/some/dir")).toBe("/some/dir/.envchain-profiles.json");
  });
});
