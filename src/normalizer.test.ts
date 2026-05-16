import { normalizeKey, normalizeValue, normalizeEnvMap, formatNormalizeSummary } from "./normalizer";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("normalizeKey", () => {
  it("uppercases keys", () => {
    expect(normalizeKey("my_var")).toBe("MY_VAR");
  });

  it("replaces hyphens with underscores", () => {
    expect(normalizeKey("my-var")).toBe("MY_VAR");
  });

  it("strips leading/trailing whitespace", () => {
    expect(normalizeKey("  MY_VAR  ")).toBe("MY_VAR");
  });

  it("replaces spaces with underscores", () => {
    expect(normalizeKey("my var")).toBe("MY_VAR");
  });

  it("removes invalid characters", () => {
    expect(normalizeKey("my!var@name")).toBe("MYVARNAME");
  });
});

describe("normalizeValue", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeValue("  hello  ")).toBe("hello");
  });

  it("returns empty string unchanged", () => {
    expect(normalizeValue("")).toBe("");
  });

  it("preserves internal whitespace", () => {
    expect(normalizeValue("hello world")).toBe("hello world");
  });

  it("strips surrounding quotes", () => {
    expect(normalizeValue('"quoted"')).toBe("quoted");
    expect(normalizeValue("'single'")).toBe("single");
  });
});

describe("normalizeEnvMap", () => {
  it("normalizes all keys and values", () => {
    const input = makeMap({ "my-var": "  hello  ", "  OTHER ": '"world"' });
    const { result } = normalizeEnvMap(input);
    expect(result.get("MY_VAR")).toBe("hello");
    expect(result.get("OTHER")).toBe("world");
  });

  it("tracks renamed keys", () => {
    const input = makeMap({ "my-var": "val" });
    const { renames } = normalizeEnvMap(input);
    expect(renames).toContainEqual({ from: "my-var", to: "MY_VAR" });
  });

  it("does not report rename when key unchanged", () => {
    const input = makeMap({ MY_VAR: "val" });
    const { renames } = normalizeEnvMap(input);
    expect(renames).toHaveLength(0);
  });
});

describe("formatNormalizeSummary", () => {
  it("returns empty message when no renames", () => {
    expect(formatNormalizeSummary([])).toContain("No keys");
  });

  it("lists each rename", () => {
    const summary = formatNormalizeSummary([{ from: "my-var", to: "MY_VAR" }]);
    expect(summary).toContain("my-var");
    expect(summary).toContain("MY_VAR");
  });
});
