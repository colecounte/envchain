import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { archiveEnvMap, listArchives, readArchive } from "./archiver";
import { diffEnvMaps } from "./differ";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-archiver-int-"));
}

describe("archiver integration with differ", () => {
  it("diffs two archived snapshots", () => {
    const dir = makeTmpDir();
    const v1 = { DB_HOST: "localhost", PORT: "5432", DEBUG: "true" };
    const v2 = { DB_HOST: "prod.db", PORT: "5432", LOG_LEVEL: "info" };

    archiveEnvMap(v1, "staging", dir);
    // small delay to ensure different timestamps
    archiveEnvMap(v2, "staging", dir);

    const entries = listArchives(dir, "staging");
    expect(entries).toHaveLength(2);

    const snap1 = readArchive(dir, entries[0].filename);
    const snap2 = readArchive(dir, entries[1].filename);

    const diff = diffEnvMaps(snap1, snap2);
    const keys = diff.map((d) => d.key);
    expect(keys).toContain("DB_HOST");
    expect(keys).toContain("DEBUG");
    expect(keys).toContain("LOG_LEVEL");
  });

  it("returns no diff for identical archives", () => {
    const dir = makeTmpDir();
    const map = { FOO: "1", BAR: "2" };
    archiveEnvMap(map, "local", dir);
    archiveEnvMap(map, "local", dir);

    const entries = listArchives(dir, "local");
    const snap1 = readArchive(dir, entries[0].filename);
    const snap2 = readArchive(dir, entries[1].filename);

    const diff = diffEnvMaps(snap1, snap2);
    expect(diff).toHaveLength(0);
  });

  it("archives multiple contexts independently", () => {
    const dir = makeTmpDir();
    archiveEnvMap({ ENV: "local" }, "local", dir);
    archiveEnvMap({ ENV: "staging" }, "staging", dir);
    archiveEnvMap({ ENV: "ci" }, "ci", dir);

    expect(listArchives(dir, "local")).toHaveLength(1);
    expect(listArchives(dir, "staging")).toHaveLength(1);
    expect(listArchives(dir, "ci")).toHaveLength(1);
    expect(listArchives(dir)).toHaveLength(3);
  });
});
