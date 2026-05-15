import { describe, it, expect } from "vitest";
import {
  createTagMap,
  addTag,
  removeTag,
  getTags,
  hasTag,
  filterByTag,
  tagMapToRecord,
  tagMapFromRecord,
  mergeTags,
} from "./tagger";

const makeMap = (entries: [string, string][] = []) => new Map(entries);

describe("addTag / hasTag", () => {
  it("adds a tag to a key", () => {
    let t = createTagMap();
    t = addTag(t, "DB_PASS", "secret");
    expect(hasTag(t, "DB_PASS", "secret")).toBe(true);
  });

  it("does not mutate original map", () => {
    const t = createTagMap();
    addTag(t, "KEY", "required");
    expect(hasTag(t, "KEY", "required")).toBe(false);
  });

  it("supports multiple tags per key", () => {
    let t = createTagMap();
    t = addTag(t, "KEY", "secret");
    t = addTag(t, "KEY", "required");
    expect(getTags(t, "KEY").size).toBe(2);
  });
});

describe("removeTag", () => {
  it("removes a tag from a key", () => {
    let t = createTagMap();
    t = addTag(t, "KEY", "deprecated");
    t = removeTag(t, "KEY", "deprecated");
    expect(hasTag(t, "KEY", "deprecated")).toBe(false);
  });

  it("removes key entirely when no tags remain", () => {
    let t = createTagMap();
    t = addTag(t, "KEY", "readonly");
    t = removeTag(t, "KEY", "readonly");
    expect(t.has("KEY")).toBe(false);
  });
});

describe("filterByTag", () => {
  it("returns only keys with matching tag", () => {
    const env = makeMap([["A", "1"], ["B", "2"], ["C", "3"]]);
    let t = createTagMap();
    t = addTag(t, "A", "secret");
    t = addTag(t, "C", "secret");
    const result = filterByTag(env, t, "secret");
    expect([...result.keys()]).toEqual(["A", "C"]);
  });
});

describe("tagMapToRecord / tagMapFromRecord", () => {
  it("round-trips correctly", () => {
    let t = createTagMap();
    t = addTag(t, "X", "required");
    t = addTag(t, "X", "secret");
    const record = tagMapToRecord(t);
    const restored = tagMapFromRecord(record);
    expect(hasTag(restored, "X", "required")).toBe(true);
    expect(hasTag(restored, "X", "secret")).toBe(true);
  });
});

describe("mergeTags", () => {
  it("merges two tag maps without losing data", () => {
    let a = createTagMap();
    a = addTag(a, "KEY", "required");
    let b = createTagMap();
    b = addTag(b, "KEY", "secret");
    b = addTag(b, "OTHER", "deprecated");
    const merged = mergeTags(a, b);
    expect(hasTag(merged, "KEY", "required")).toBe(true);
    expect(hasTag(merged, "KEY", "secret")).toBe(true);
    expect(hasTag(merged, "OTHER", "deprecated")).toBe(true);
  });
});
