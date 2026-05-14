import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  listSnapshots,
  diffSnapshots,
} from "./snapshot";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-snap-"));
}

describe("createSnapshot", () => {
  it("creates a snapshot with context and vars", () => {
    const snap = createSnapshot("local", { FOO: "bar", BAZ: "qux" });
    expect(snap.context).toBe("local");
    expect(snap.vars).toEqual({ FOO: "bar", BAZ: "qux" });
    expect(snap.timestamp).toBeTruthy();
  });

  it("does not mutate original vars", () => {
    const vars = { A: "1" };
    const snap = createSnapshot("ci", vars);
    snap.vars.B = "2";
    expect(vars).not.toHaveProperty("B");
  });
});

describe("saveSnapshot / loadSnapshot", () => {
  it("round-trips a snapshot to disk", () => {
    const dir = makeTmpDir();
    const snap = createSnapshot("staging", { KEY: "value" });
    const filepath = saveSnapshot(snap, dir);
    const loaded = loadSnapshot(filepath);
    expect(loaded.context).toBe("staging");
    expect(loaded.vars).toEqual({ KEY: "value" });
  });

  it("throws on invalid snapshot file", () => {
    const dir = makeTmpDir();
    const fp = path.join(dir, "bad.json");
    fs.writeFileSync(fp, JSON.stringify({ foo: "bar" }));
    expect(() => loadSnapshot(fp)).toThrow("Invalid snapshot file");
  });
});

describe("listSnapshots", () => {
  it("returns empty array for missing dir", () => {
    expect(listSnapshots("/nonexistent/path")).toEqual([]);
  });

  it("lists saved snapshots sorted", () => {
    const dir = makeTmpDir();
    const s1 = createSnapshot("local", { A: "1" });
    const s2 = createSnapshot("local", { B: "2" });
    saveSnapshot(s1, dir);
    saveSnapshot(s2, dir);
    const list = listSnapshots(dir);
    expect(list.length).toBe(2);
  });
});

describe("diffSnapshots", () => {
  it("detects added, removed, and changed keys", () => {
    const a = createSnapshot("local", { FOO: "1", BAR: "2", OLD: "x" });
    const b = createSnapshot("local", { FOO: "1", BAR: "changed", NEW: "y" });
    const diff = diffSnapshots(a, b);
    expect(diff.added).toEqual({ NEW: "y" });
    expect(diff.removed).toEqual({ OLD: "x" });
    expect(diff.changed).toEqual({ BAR: ["2", "changed"] });
  });

  it("returns empty diff for identical snapshots", () => {
    const a = createSnapshot("ci", { X: "1" });
    const b = createSnapshot("ci", { X: "1" });
    const diff = diffSnapshots(a, b);
    expect(diff.added).toEqual({});
    expect(diff.removed).toEqual({});
    expect(diff.changed).toEqual({});
  });
});
