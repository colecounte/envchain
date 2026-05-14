import { describe, it, expect } from "bun:test";
import {
  isSensitiveKey,
  redactValue,
  redactEnvMap,
  redactRecord,
} from "./redactor";

const makeMap = (obj: Record<string, string>) => new Map(Object.entries(obj));

describe("isSensitiveKey", () => {
  it("detects secret keys", () => {
    expect(isSensitiveKey("SECRET_KEY")).toBe(true);
    expect(isSensitiveKey("DB_PASSWORD")).toBe(true);
    expect(isSensitiveKey("API_TOKEN")).toBe(true);
    expect(isSensitiveKey("PRIVATE_KEY")).toBe(true);
    expect(isSensitiveKey("JWT_SECRET")).toBe(true);
  });

  it("allows non-sensitive keys", () => {
    expect(isSensitiveKey("APP_NAME")).toBe(false);
    expect(isSensitiveKey("PORT")).toBe(false);
    expect(isSensitiveKey("NODE_ENV")).toBe(false);
  });

  it("uses custom pattern", () => {
    expect(isSensitiveKey("MY_CUSTOM", /custom/i)).toBe(true);
    expect(isSensitiveKey("PORT", /custom/i)).toBe(false);
  });
});

describe("redactValue", () => {
  it("fully masks by default", () => {
    expect(redactValue("supersecret")).toBe("****");
  });

  it("uses custom mask", () => {
    expect(redactValue("supersecret", { mask: "[HIDDEN]" })).toBe("[HIDDEN]");
  });

  it("reveals leading chars", () => {
    expect(redactValue("supersecret", { revealChars: 3 })).toBe("sup****");
  });

  it("fully masks if value shorter than revealChars", () => {
    expect(redactValue("ab", { revealChars: 5 })).toBe("****");
  });
});

describe("redactEnvMap", () => {
  it("redacts sensitive keys and preserves others", () => {
    const env = makeMap({
      APP_NAME: "myapp",
      DB_PASSWORD: "hunter2",
      API_TOKEN: "tok_abc123",
      PORT: "3000",
    });
    const result = redactEnvMap(env);
    expect(result.get("APP_NAME")).toBe("myapp");
    expect(result.get("PORT")).toBe("3000");
    expect(result.get("DB_PASSWORD")).toBe("****");
    expect(result.get("API_TOKEN")).toBe("****");
  });

  it("applies revealChars option", () => {
    const env = makeMap({ SECRET_KEY: "abcdefgh" });
    const result = redactEnvMap(env, { revealChars: 2 });
    expect(result.get("SECRET_KEY")).toBe("ab****");
  });
});

describe("redactRecord", () => {
  it("redacts sensitive keys in plain object", () => {
    const env = { NODE_ENV: "production", DB_PASSWORD: "s3cr3t" };
    const result = redactRecord(env);
    expect(result.NODE_ENV).toBe("production");
    expect(result.DB_PASSWORD).toBe("****");
  });
});
