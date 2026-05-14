import { EnvSnapshot, diffSnapshots, listSnapshots, loadSnapshot } from "./snapshot";

export interface AuditEntry {
  from: string;
  to: string;
  context: string;
  added: number;
  removed: number;
  changed: number;
  details: ReturnType<typeof diffSnapshots>;
}

export function auditSnapshotHistory(dir: string): AuditEntry[] {
  const files = listSnapshots(dir);
  if (files.length < 2) return [];

  const entries: AuditEntry[] = [];
  for (let i = 0; i < files.length - 1; i++) {
    const a: EnvSnapshot = loadSnapshot(files[i]);
    const b: EnvSnapshot = loadSnapshot(files[i + 1]);
    const details = diffSnapshots(a, b);
    entries.push({
      from: a.timestamp,
      to: b.timestamp,
      context: b.context,
      added: Object.keys(details.added).length,
      removed: Object.keys(details.removed).length,
      changed: Object.keys(details.changed).length,
      details,
    });
  }
  return entries;
}

export function formatAuditEntry(entry: AuditEntry): string {
  const lines: string[] = [
    `[${entry.context}] ${entry.from} → ${entry.to}`,
    `  +${entry.added} added, -${entry.removed} removed, ~${entry.changed} changed`,
  ];
  for (const [k, v] of Object.entries(entry.details.added)) {
    lines.push(`  + ${k}=${v}`);
  }
  for (const [k] of Object.entries(entry.details.removed)) {
    lines.push(`  - ${k}`);
  }
  for (const [k, [prev, next]] of Object.entries(entry.details.changed)) {
    lines.push(`  ~ ${k}: ${prev} → ${next}`);
  }
  return lines.join("\n");
}

export function formatAuditLog(entries: AuditEntry[]): string {
  if (entries.length === 0) return "No audit history available.";
  return entries.map(formatAuditEntry).join("\n\n");
}
