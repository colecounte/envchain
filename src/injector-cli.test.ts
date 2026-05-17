import { describe, it, expect } from "vitest";
import { parseInjectArgs } from "./injector-cli";

describe("parseInjectArgs", () => {
  it("returns defaults when no args given", () => {
    const result = parseInjectArgs([]);
    expect(result.context).toBe("local");
    expect(result.options.override).toBe(false);
    expect(result.options.dryRun).toBe(false);
    expect(result.options.prefix).toBe("");
    expect(result.help).toBe(false);
  });

  it("parses --override flag", () => {
    const result = parseInjectArgs(["--override"]);
    expect(result.options.override).toBe(true);
  });

  it("parses --dry-run flag", () => {
    const result = parseInjectArgs(["--dry-run"]);
    expect(result.options.dryRun).toBe(true);
  });

  it("parses --prefix value", () => {
    const result = parseInjectArgs(["--prefix", "MY_"]);
    expect(result.options.prefix).toBe("MY_");
  });

  it("parses --context value", () => {
    const result = parseInjectArgs(["--context", "staging"]);
    expect(result.context).toBe("staging");
  });

  it("parses positional context argument", () => {
    const result = parseInjectArgs(["production"]);
    expect(result.context).toBe("production");
  });

  it("parses --help flag", () => {
    const result = parseInjectArgs(["--help"]);
    expect(result.help).toBe(true);
  });

  it("parses combined flags", () => {
    const result = parseInjectArgs(["--override", "--prefix", "CI_", "ci"]);
    expect(result.options.override).toBe(true);
    expect(result.options.prefix).toBe("CI_");
    expect(result.context).toBe("ci");
  });
});
