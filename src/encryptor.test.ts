import { describe, it, expect } from "vitest";
import {
  encryptValue,
  decryptValue,
  isEncrypted,
  encryptEnvMap,
  decryptEnvMap,
} from "./encryptor";

const PASS = "super-secret-passphrase";

function makeMap(obj: Record<string, string>): Map<string, string> {
  return new Map(Object.entries(obj));
}

describe("isEncrypted", () => {
  it("returns true for enc: prefixed values", () => {
    expect(isEncrypted("enc:abc123")).toBe(true);
  });

  it("returns false for plain values", () => {
    expect(isEncrypted("plaintext")).toBe(false);
  });
});

describe("encryptValue / decryptValue", () => {
  it("encrypts a value with enc: prefix", () => {
    const result = encryptValue("my-secret", PASS);
    expect(result).toMatch(/^enc:/);
  });

  it("decrypts back to original value", () => {
    const encrypted = encryptValue("hello-world", PASS);
    expect(decryptValue(encrypted, PASS)).toBe("hello-world");
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encryptValue("same", PASS);
    const b = encryptValue("same", PASS);
    expect(a).not.toBe(b);
  });

  it("throws on wrong passphrase", () => {
    const encrypted = encryptValue("secret", PASS);
    expect(() => decryptValue(encrypted, "wrong-pass")).toThrow();
  });

  it("throws if value is not encrypted", () => {
    expect(() => decryptValue("plaintext", PASS)).toThrow("Value is not encrypted");
  });
});

describe("encryptEnvMap", () => {
  it("encrypts all values when no key filter given", () => {
    const map = makeMap({ FOO: "bar", BAZ: "qux" });
    const result = encryptEnvMap(map, PASS);
    expect(isEncrypted(result.get("FOO")!)).toBe(true);
    expect(isEncrypted(result.get("BAZ")!)).toBe(true);
  });

  it("only encrypts specified keys", () => {
    const map = makeMap({ FOO: "bar", BAZ: "qux" });
    const result = encryptEnvMap(map, PASS, ["FOO"]);
    expect(isEncrypted(result.get("FOO")!)).toBe(true);
    expect(result.get("BAZ")).toBe("qux");
  });

  it("does not double-encrypt already encrypted values", () => {
    const map = makeMap({ FOO: encryptValue("already", PASS) });
    const result = encryptEnvMap(map, PASS);
    expect(decryptValue(result.get("FOO")!, PASS)).toBe("already");
  });
});

describe("decryptEnvMap", () => {
  it("decrypts all encrypted values, leaves plain ones", () => {
    const map = makeMap({
      SECRET: encryptValue("hidden", PASS),
      PLAIN: "visible",
    });
    const result = decryptEnvMap(map, PASS);
    expect(result.get("SECRET")).toBe("hidden");
    expect(result.get("PLAIN")).toBe("visible");
  });
});
