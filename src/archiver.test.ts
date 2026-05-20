import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  archiveEnvMap,
  listArchives,
  readArchive,
  loadArchiveIndex,
} from "./archiver";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-archiver-"));
}

function makeMap(obj: Record<string, string>): Record<string, string> {
  return obj;
}

describe("archiveEnvMap", () => {
  it("writes an archive file and returns its path", () => {
    const dir = makeTmpDir();
    const map = makeMap({ FOO: "bar", BAZ: "qux" });
    const filePath = archiveEnvMap(map, "local", dir);
    expect(fs.existsSync(filePath)).toBe(true);
    const content = fs.readFileSync(filePath, "utf8");
    expect(content).toContain("FOO=bar");
    expect(content).toContain("BAZ=qux");
  });

  it("updates the archive index", () => {
    const dir = makeTmpDir();
    archiveEnvMap(makeMap({ A: "1" }), "staging", dir);
    const index = loadArchiveIndex(dir);
    expect(index.entries).toHaveLength(1);
    expect(index.entries[0].context).toBe("staging");
    expect(index.entries[0].keys).toContain("A");
  });
});

describe("listArchives", () => {
  it("returns all entries when no context filter", () => {
    const dir = makeTmpDir();
    archiveEnvMap(makeMap({ X: "1" }), "local", dir);
    archiveEnvMap(makeMap({ Y: "2" }), "ci", dir);
    const entries = listArchives(dir);
    expect(entries).toHaveLength(2);
  });

  it("filters by context", () => {
    const dir = makeTmpDir();
    archiveEnvMap(makeMap({ X: "1" }), "local", dir);
    archiveEnvMap(makeMap({ Y: "2" }), "ci", dir);
    const entries = listArchives(dir, "ci");
    expect(entries).toHaveLength(1);
    expect(entries[0].context).toBe("ci");
  });

  it("returns empty array when no archives exist", () => {
    const dir = makeTmpDir();
    expect(listArchives(dir)).toEqual([]);
  });
});

describe("readArchive", () => {
  it("reads back the archived env map", () => {
    const dir = makeTmpDir();
    const map = makeMap({ DB_URL: "postgres://localhost", PORT: "5432" });
    archiveEnvMap(map, "local", dir);
    const entries = listArchives(dir);
    const restored = readArchive(dir, entries[0].filename);
    expect(restored["DB_URL"]).toBe("postgres://localhost");
    expect(restored["PORT"]).toBe("5432");
  });

  it("throws if archive not found", () => {
    const dir = makeTmpDir();
    expect(() => readArchive(dir, "nonexistent.env")).toThrow("Archive not found");
  });
});
