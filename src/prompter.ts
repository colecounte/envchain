import * as readline from "readline";

export type PromptField = {
  key: string;
  label?: string;
  secret?: boolean;
  defaultValue?: string;
};

export type PromptResult = Map<string, string>;

export async function promptField(field: PromptField): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  if (field.secret) {
    (rl as any).stdoutMuted = true;
    rl.on("keypress", () => {
      if ((rl as any).stdoutMuted) {
        process.stdout.clearLine(0, () => {});
        process.stdout.cursorTo(0, () => {});
        const label = field.label ?? field.key;
        process.stdout.write(`${label}: `);
      }
    });
  }

  const label = field.label ?? field.key;
  const hint = field.defaultValue ? ` [${field.defaultValue}]` : "";
  const prompt = field.secret ? `${label}${hint}: ` : `${label}${hint}: `;

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      if (field.secret) process.stdout.write("\n");
      rl.close();
      resolve(answer.trim() || field.defaultValue || "");
    });
  });
}

export async function promptEnvMap(fields: PromptField[]): Promise<PromptResult> {
  const result: PromptResult = new Map();
  for (const field of fields) {
    const value = await promptField(field);
    result.set(field.key, value);
  }
  return result;
}

export function fieldsFromKeys(keys: string[], secretPatterns: RegExp[] = []): PromptField[] {
  const defaultSecretPattern = /secret|password|token|key|pass|pwd/i;
  return keys.map((key) => {
    const isSecret =
      defaultSecretPattern.test(key) ||
      secretPatterns.some((p) => p.test(key));
    return { key, label: key, secret: isSecret };
  });
}

export function mergePromptResult(
  base: Map<string, string>,
  prompted: PromptResult
): Map<string, string> {
  const merged = new Map(base);
  for (const [key, value] of prompted) {
    if (value !== "") merged.set(key, value);
  }
  return merged;
}
