import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export type EnvMap = Map<string, string>;

export function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, KEY_LENGTH);
}

export function encryptValue(value: string, passphrase: string): string {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(passphrase, salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([salt, iv, tag, encrypted]);
  return "enc:" + payload.toString("base64");
}

export function decryptValue(encoded: string, passphrase: string): string {
  if (!encoded.startsWith("enc:")) {
    throw new Error("Value is not encrypted");
  }
  const payload = Buffer.from(encoded.slice(4), "base64");
  const salt = payload.subarray(0, 16);
  const iv = payload.subarray(16, 16 + IV_LENGTH);
  const tag = payload.subarray(16 + IV_LENGTH, 16 + IV_LENGTH + TAG_LENGTH);
  const encrypted = payload.subarray(16 + IV_LENGTH + TAG_LENGTH);
  const key = deriveKey(passphrase, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith("enc:");
}

export function encryptEnvMap(map: EnvMap, passphrase: string, keys?: string[]): EnvMap {
  const result: EnvMap = new Map();
  for (const [k, v] of map) {
    if (!isEncrypted(v) && (keys === undefined || keys.includes(k))) {
      result.set(k, encryptValue(v, passphrase));
    } else {
      result.set(k, v);
    }
  }
  return result;
}

export function decryptEnvMap(map: EnvMap, passphrase: string): EnvMap {
  const result: EnvMap = new Map();
  for (const [k, v] of map) {
    if (isEncrypted(v)) {
      result.set(k, decryptValue(v, passphrase));
    } else {
      result.set(k, v);
    }
  }
  return result;
}
