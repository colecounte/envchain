/**
 * transformer.ts — Apply transformation functions to env map values
 */

export type TransformFn = (value: string, key: string) => string;

export type TransformRule = {
  pattern: RegExp | string;
  transform: TransformFn;
};

export function matchesRule(key: string, pattern: RegExp | string): boolean {
  if (pattern instanceof RegExp) return pattern.test(key);
  return key === pattern || key.startsWith(pattern);
}

export function applyTransformRule(
  map: Map<string, string>,
  rule: TransformRule
): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of map) {
    if (matchesRule(key, rule.pattern)) {
      result.set(key, rule.transform(value, key));
    } else {
      result.set(key, value);
    }
  }
  return result;
}

export function transformEnvMap(
  map: Map<string, string>,
  rules: TransformRule[]
): Map<string, string> {
  let result = new Map(map);
  for (const rule of rules) {
    result = applyTransformRule(result, rule);
  }
  return result;
}

// Built-in transform helpers
export const upperCase: TransformFn = (v) => v.toUpperCase();
export const lowerCase: TransformFn = (v) => v.toLowerCase();
export const trim: TransformFn = (v) => v.trim();
export const base64Encode: TransformFn = (v) =>
  Buffer.from(v).toString("base64");
export const base64Decode: TransformFn = (v) =>
  Buffer.from(v, "base64").toString("utf8");
export const jsonStringify: TransformFn = (v) => {
  try {
    return JSON.stringify(JSON.parse(v));
  } catch {
    return JSON.stringify(v);
  }
};

export const builtinTransforms: Record<string, TransformFn> = {
  upper: upperCase,
  lower: lowerCase,
  trim,
  base64encode: base64Encode,
  base64decode: base64Decode,
  json: jsonStringify,
};

export function resolveTransformFn(name: string): TransformFn | undefined {
  return builtinTransforms[name.toLowerCase()];
}
