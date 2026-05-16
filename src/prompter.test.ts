import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fieldsFromKeys,
  mergePromptResult,
  PromptField,
} from "./prompter";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("fieldsFromKeys", () => {
  it("marks secret keys automatically", () => {
    const fields = fieldsFromKeys(["DB_HOST", "DB_PASSWORD", "API_TOKEN"]);
    expect(fields.find((f) => f.key === "DB_HOST")?.secret).toBe(false);
    expect(fields.find((f) => f.key === "DB_PASSWORD")?.secret).toBe(true);
    expect(fields.find((f) => f.key === "API_TOKEN")?.secret).toBe(true);
  });

  it("applies custom secret patterns", () => {
    const fields = fieldsFromKeys(["MY_CERT", "MY_URL"], [/cert/i]);
    expect(fields.find((f) => f.key === "MY_CERT")?.secret).toBe(true);
    expect(fields.find((f) => f.key === "MY_URL")?.secret).toBe(false);
  });

  it("sets label equal to key", () => {
    const fields = fieldsFromKeys(["FOO", "BAR"]);
    expect(fields[0].label).toBe("FOO");
    expect(fields[1].label).toBe("BAR");
  });

  it("returns empty array for empty input", () => {
    expect(fieldsFromKeys([])).toEqual([]);
  });
});

describe("mergePromptResult", () => {
  it("merges prompted values into base map", () => {
    const base = makeMap({ HOST: "localhost", PORT: "5432" });
    const prompted = makeMap({ PORT: "3306", PASSWORD: "secret" });
    const result = mergePromptResult(base, prompted);
    expect(result.get("HOST")).toBe("localhost");
    expect(result.get("PORT")).toBe("3306");
    expect(result.get("PASSWORD")).toBe("secret");
  });

  it("skips empty prompted values", () => {
    const base = makeMap({ KEY: "original" });
    const prompted = makeMap({ KEY: "" });
    const result = mergePromptResult(base, prompted);
    expect(result.get("KEY")).toBe("original");
  });

  it("does not mutate the base map", () => {
    const base = makeMap({ A: "1" });
    const prompted = makeMap({ A: "2" });
    mergePromptResult(base, prompted);
    expect(base.get("A")).toBe("1");
  });

  it("handles empty prompted map", () => {
    const base = makeMap({ X: "10" });
    const result = mergePromptResult(base, new Map());
    expect(result.get("X")).toBe("10");
  });
});
