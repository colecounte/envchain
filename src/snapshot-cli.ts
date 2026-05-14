import * as path from "path";
import { createSnapshot, saveSnapshot, listSnapshots, loadSnapshot } from "./snapshot";
import { auditSnapshotHistory, formatAuditLog } from "./audit";
import { resolveEnv } from "./resolver";

const DEFAULT_SNAPSHOT_DIR = ".envchain/snapshots";

export interface SnapshotCliArgs {
  command: "save" | "list" | "diff" | "audit";
  context?: string;
  dir?: string;
  from?: string;
  to?: string;
}

export async function runSnapshotCli(args: SnapshotCliArgs): Promise<string> {
  const dir = args.dir ?? DEFAULT_SNAPSHOT_DIR;
  const context = args.context ?? "local";

  switch (args.command) {
    case "save": {
      const vars = resolveEnv(context);
      const snap = createSnapshot(context, vars);
      const fp = saveSnapshot(snap, dir);
      return `Snapshot saved: ${fp}`;
    }

    case "list": {
      const files = listSnapshots(dir);
      if (files.length === 0) return "No snapshots found.";
      return files.map((f) => path.basename(f)).join("\n");
    }

    case "diff": {
      const files = listSnapshots(dir);
      if (files.length < 2) return "Need at least 2 snapshots to diff.";
      const fromFile = args.from ? path.join(dir, args.from) : files[files.length - 2];
      const toFile = args.to ? path.join(dir, args.to) : files[files.length - 1];
      const a = loadSnapshot(fromFile);
      const b = loadSnapshot(toFile);
      const { added, removed, changed } = require("./snapshot").diffSnapshots(a, b);
      const lines: string[] = [`Diff: ${a.timestamp} → ${b.timestamp}`];
      for (const [k, v] of Object.entries(added as Record<string, string>)) lines.push(`+ ${k}=${v}`);
      for (const [k] of Object.entries(removed as Record<string, string>)) lines.push(`- ${k}`);
      for (const [k, pair] of Object.entries(changed as Record<string, [string, string]>)) lines.push(`~ ${k}: ${pair[0]} → ${pair[1]}`);
      return lines.join("\n") || "No differences.";
    }

    case "audit": {
      const entries = auditSnapshotHistory(dir);
      return formatAuditLog(entries);
    }

    default:
      return `Unknown snapshot command.`;
  }
}
