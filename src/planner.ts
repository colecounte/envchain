/**
 * planner.ts — Generates a human-readable execution plan showing which env files
 * will be loaded, merged, and in what order before any changes are applied.
 */

export interface PlanStep {
  order: number;
  file: string;
  context: string;
  exists: boolean;
  keyCount: number;
  overrides: string[];
}

export interface EnvPlan {
  steps: PlanStep[];
  finalKeys: string[];
  conflicts: Array<{ key: string; winner: string; losers: string[] }>;
}

export function buildPlan(
  candidates: Array<{ file: string; context: string; map: Map<string, string>; exists: boolean }>
): EnvPlan {
  const steps: PlanStep[] = [];
  const seen = new Map<string, string>(); // key -> context that last set it
  const conflicts: EnvPlan["conflicts"] = [];
  const conflictMap = new Map<string, { winner: string; losers: string[] }>();

  for (let i = 0; i < candidates.length; i++) {
    const { file, context, map, exists } = candidates[i];
    const overrides: string[] = [];

    for (const key of map.keys()) {
      if (seen.has(key)) {
        overrides.push(key);
        const prev = seen.get(key)!;
        if (!conflictMap.has(key)) {
          conflictMap.set(key, { winner: context, losers: [prev] });
        } else {
          const entry = conflictMap.get(key)!;
          entry.losers.push(entry.winner);
          entry.winner = context;
        }
      }
      seen.set(key, context);
    }

    steps.push({ order: i + 1, file, context, exists, keyCount: map.size, overrides });
  }

  for (const [key, val] of conflictMap.entries()) {
    conflicts.push({ key, ...val });
  }

  return { steps, finalKeys: Array.from(seen.keys()), conflicts };
}

export function formatPlan(plan: EnvPlan): string {
  const lines: string[] = ["Execution Plan:", ""];

  for (const step of plan.steps) {
    const status = step.exists ? "✔" : "✘ (missing)";
    lines.push(`  [${step.order}] ${step.file} (${step.context}) ${status}`);
    lines.push(`       keys: ${step.keyCount}`);
    if (step.overrides.length > 0) {
      lines.push(`       overrides: ${step.overrides.join(", ")}`);
    }
  }

  lines.push("");
  lines.push(`Final key count: ${plan.finalKeys.length}`);

  if (plan.conflicts.length > 0) {
    lines.push("");
    lines.push("Conflicts:");
    for (const c of plan.conflicts) {
      lines.push(`  ${c.key}: '${c.winner}' wins over [${c.losers.join(", ")}]`);
    }
  }

  return lines.join("\n");
}
