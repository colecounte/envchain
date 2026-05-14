import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { createSnapshot, saveSnapshot } from "./snapshot";
import { auditSnapshotHistory, formatAuditLog, formatAuditEntry } from "./audit";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envchain-audit-"));
}

describe("auditSnapshotHistory", () => {
  it("returns empty array when fewer than 2 snapshots", () => {
    const dir = makeTmpDir();
    expect(auditSnapshotHistory(dir)).toEqual([]);
    const snap = createSnapshot("local", { A: "1" });
    saveSnapshot(snap, dir);
    expect(auditSnapshotHistory(dir)).toEqual([]);
  });

  it("produces one entry for two snapshots", async () => {
    const dir = makeTmpDir();
    const s1 = createSnapshot("local", { FOO: "1", OLD: "x" });
    await new Promise((r) => setTimeout(r, 10));
    const s2 = createSnapshot("local", { FOO: "changed", NEW: "y" });
    saveSnapshot(s1, dir);
    saveSnapshot(s2, dir);
    const entries = auditSnapshotHistory(dir);
    expect(entries.length).toBe(1);
    expect(entries[0].added).toBe(1);
    expect(entries[0].removed).toBe(1);
    expect(entries[0].changed).toBe(1);
    expect(entries[0].context).toBe("local");
  });

  it("produces N-1 entries for N snapshots", async () => {
    const dir = makeTmpDir();
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 10));
      saveSnapshot(createSnapshot("ci", { I: String(i) }), dir);
    }
    expect(auditSnapshotHistory(dir).length).toBe(3);
  });
});

describe("formatAuditEntry", () => {
  it("formats an entry with changes", async () => {
    const dir = makeTmpDir();
    const s1 = createSnapshot("staging", { A: "old" });
    await new Promise((r) => setTimeout(r, 10));
    const s2 = createSnapshot("staging", { A: "new", B: "added" });
    saveSnapshot(s1, dir);
    saveSnapshot(s2, dir);
    const [entry] = auditSnapshotHistory(dir);
    const text = formatAuditEntry(entry);
    expect(text).toContain("staging");
    expect(text).toContain("+ B=added");
    expect(text).toContain("~ A: old → new");
  });
});

describe("formatAuditLog", () => {
  it("returns message when no entries", () => {
    expect(formatAuditLog([])).toBe("No audit history available.");
  });

  it("joins multiple entries with blank lines", async () => {
    const dir = makeTmpDir();
    for (let i = 0; i < 3; i++) {
      await new Promise((r) => setTimeout(r, 10));
      saveSnapshot(createSnapshot("local", { N: String(i) }), dir);
    }
    const entries = auditSnapshotHistory(dir);
    const log = formatAuditLog(entries);
    expect(log.split("\n\n").length).toBe(2);
  });
});
