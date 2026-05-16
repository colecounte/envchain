import { describe, it, expect } from "bun:test";
import { buildPlan, formatPlan } from "./planner";

function makeCandidate(
  file: string,
  context: string,
  entries: Record<string, string>,
  exists = true
) {
  return { file, context, map: new Map(Object.entries(entries)), exists };
}

describe("buildPlan", () => {
  it("returns steps in order", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { A: "1", B: "2" }),
      makeCandidate(".env.local", "local", { C: "3" }),
    ]);
    expect(plan.steps).toHaveLength(2);
    expect(plan.steps[0].order).toBe(1);
    expect(plan.steps[1].order).toBe(2);
  });

  it("tracks final keys across all candidates", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { A: "1", B: "2" }),
      makeCandidate(".env.local", "local", { B: "override", C: "3" }),
    ]);
    expect(plan.finalKeys).toContain("A");
    expect(plan.finalKeys).toContain("B");
    expect(plan.finalKeys).toContain("C");
    expect(plan.finalKeys).toHaveLength(3);
  });

  it("detects conflicts and records winner/losers", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { PORT: "3000" }),
      makeCandidate(".env.local", "local", { PORT: "4000" }),
    ]);
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0].key).toBe("PORT");
    expect(plan.conflicts[0].winner).toBe("local");
    expect(plan.conflicts[0].losers).toContain("base");
  });

  it("records overrides per step", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { X: "1" }),
      makeCandidate(".env.ci", "ci", { X: "2", Y: "3" }),
    ]);
    expect(plan.steps[1].overrides).toContain("X");
    expect(plan.steps[1].overrides).not.toContain("Y");
  });

  it("marks missing files", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", {}, false),
    ]);
    expect(plan.steps[0].exists).toBe(false);
  });

  it("returns empty plan for no candidates", () => {
    const plan = buildPlan([]);
    expect(plan.steps).toHaveLength(0);
    expect(plan.finalKeys).toHaveLength(0);
    expect(plan.conflicts).toHaveLength(0);
  });
});

describe("formatPlan", () => {
  it("includes file names and contexts", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { A: "1" }),
    ]);
    const out = formatPlan(plan);
    expect(out).toContain(".env");
    expect(out).toContain("base");
    expect(out).toContain("keys: 1");
  });

  it("lists conflicts in output", () => {
    const plan = buildPlan([
      makeCandidate(".env", "base", { PORT: "3000" }),
      makeCandidate(".env.local", "local", { PORT: "4000" }),
    ]);
    const out = formatPlan(plan);
    expect(out).toContain("Conflicts:");
    expect(out).toContain("PORT");
    expect(out).toContain("local");
  });

  it("shows missing status for absent files", () => {
    const plan = buildPlan([
      makeCandidate(".env.staging", "staging", {}, false),
    ]);
    const out = formatPlan(plan);
    expect(out).toContain("missing");
  });
});
