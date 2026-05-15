import { describe, it, expect } from "vitest";
import {
  createTagMap,
  addTag,
  filterByTag,
  mergeTags,
  tagMapToRecord,
  tagMapFromRecord,
} from "./tagger";
import { parseEnvContent } from "./parser";
import { redactEnvMap } from "./redactor";

const ENV_CONTENT = `
DB_PASSWORD=supersecret
DB_HOST=localhost
API_KEY=abc123
APP_ENV=production
DEPRECATED_FLAG=true
`.trim();

describe("tagger integration", () => {
  it("tags secrets and filters them for redaction", () => {
    const envMap = parseEnvContent(ENV_CONTENT);
    let tagMap = createTagMap();
    tagMap = addTag(tagMap, "DB_PASSWORD", "secret");
    tagMap = addTag(tagMap, "API_KEY", "secret");

    const secrets = filterByTag(envMap, tagMap, "secret");
    const redacted = redactEnvMap(secrets);

    expect(redacted.get("DB_PASSWORD")).toBe("***");
    expect(redacted.get("API_KEY")).toBe("***");
    expect(redacted.has("APP_ENV")).toBe(false);
  });

  it("merges tag maps from two sources", () => {
    let base = createTagMap();
    base = addTag(base, "DB_PASSWORD", "secret");
    base = addTag(base, "APP_ENV", "required");

    let overlay = createTagMap();
    overlay = addTag(overlay, "API_KEY", "secret");
    overlay = addTag(overlay, "APP_ENV", "readonly");

    const merged = mergeTags(base, overlay);
    const record = tagMapToRecord(merged);

    expect(record["APP_ENV"]).toContain("required");
    expect(record["APP_ENV"]).toContain("readonly");
    expect(record["DB_PASSWORD"]).toContain("secret");
    expect(record["API_KEY"]).toContain("secret");
  });

  it("round-trips tag map through serialization", () => {
    let tagMap = createTagMap();
    tagMap = addTag(tagMap, "DB_PASSWORD", "secret");
    tagMap = addTag(tagMap, "DEPRECATED_FLAG", "deprecated");

    const serialized = JSON.stringify(tagMapToRecord(tagMap));
    const restored = tagMapFromRecord(JSON.parse(serialized));

    const envMap = parseEnvContent(ENV_CONTENT);
    const deprecated = filterByTag(envMap, restored, "deprecated");
    expect([...deprecated.keys()]).toEqual(["DEPRECATED_FLAG"]);
  });
});
