/**
 * scheduler.ts
 * Provides scheduled/cron-based env refresh and reload capabilities.
 * Allows envchain to periodically re-resolve env files and detect drift.
 */

import { resolveEnv } from "./resolver";
import { diffEnvMaps } from "./differ";
import { detectDrift } from "./freezer";

export interface ScheduleOptions {
  /** Interval in milliseconds between env refresh checks */
  intervalMs: number;
  /** Contexts to resolve on each tick */
  contexts: string[];
  /** Base directory to search for env files */
  cwd?: string;
  /** Called when a change is detected between ticks */
  onChange?: (diff: ScheduleDiff) => void;
  /** Called on each tick regardless of changes */
  onTick?: (snapshot: Record<string, string>) => void;
  /** Called when an error occurs during resolution */
  onError?: (err: Error) => void;
}

export interface ScheduleDiff {
  /** Timestamp of the change detection */
  timestamp: Date;
  /** Keys that were added */
  added: string[];
  /** Keys that were removed */
  removed: string[];
  /** Keys whose values changed */
  changed: string[];
  /** The previous env snapshot */
  previous: Record<string, string>;
  /** The current env snapshot */
  current: Record<string, string>;
}

export interface ScheduleHandle {
  /** Stop the scheduled refresh */
  stop: () => void;
  /** Force an immediate refresh tick */
  tick: () => Promise<void>;
  /** Whether the scheduler is currently running */
  running: boolean;
}

/**
 * Starts a scheduled env refresh loop.
 * Resolves env on each interval, compares to previous snapshot,
 * and fires onChange if any keys have been added, removed, or modified.
 */
export function scheduleEnvRefresh(options: ScheduleOptions): ScheduleHandle {
  const { intervalMs, contexts, cwd = process.cwd(), onChange, onTick, onError } = options;

  let previous: Record<string, string> = {};
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const handle: ScheduleHandle = {
    get running() {
      return running;
    },
    stop() {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      running = false;
    },
    async tick() {
      try {
        const envMap = await resolveEnv(contexts, cwd);
        const current: Record<string, string> = {};
        for (const [k, v] of envMap) current[k] = v;

        if (onTick) onTick(current);

        if (onChange) {
          const prevMap = new Map(Object.entries(previous));
          const currMap = new Map(Object.entries(current));
          const diff = diffEnvMaps(prevMap, currMap);

          const added = diff.filter(d => d.type === "added").map(d => d.key);
          const removed = diff.filter(d => d.type === "removed").map(d => d.key);
          const changed = diff.filter(d => d.type === "changed").map(d => d.key);

          if (added.length > 0 || removed.length > 0 || changed.length > 0) {
            onChange({
              timestamp: new Date(),
              added,
              removed,
              changed,
              previous,
              current,
            });
          }
        }

        previous = current;
      } catch (err) {
        if (onError) onError(err instanceof Error ? err : new Error(String(err)));
      }
    },
  };

  // Run an initial tick immediately, then start the interval
  handle.tick().then(() => {
    timer = setInterval(() => handle.tick(), intervalMs);
    running = true;
  });

  return handle;
}

/**
 * Formats a ScheduleDiff into a human-readable summary string.
 */
export function formatScheduleDiff(diff: ScheduleDiff): string {
  const lines: string[] = [
    `[${diff.timestamp.toISOString()}] Env change detected:`,
  ];
  if (diff.added.length > 0) lines.push(`  + Added:   ${diff.added.join(", ")}`);
  if (diff.removed.length > 0) lines.push(`  - Removed: ${diff.removed.join(", ")}`);
  if (diff.changed.length > 0) lines.push(`  ~ Changed: ${diff.changed.join(", ")}`);
  return lines.join("\n");
}
