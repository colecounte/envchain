import { addProfile, getProfile, listProfiles, removeProfile, type EnvProfile } from "./profile";

function printUsage(): void {
  console.log(`
envchain profile <command> [options]

Commands:
  add <name> --contexts <ctx,...> [--base-dir <dir>] [--desc <text>]
  remove <name>
  get <name>
  list

Options:
  --contexts   Comma-separated list of contexts (required for add)
  --base-dir   Base directory for .env files (default: cwd)
  --desc       Optional description for the profile
`.trim());
}

export function runProfileCli(argv: string[], baseDir: string = process.cwd()): void {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "list") {
    const profiles = listProfiles(baseDir);
    if (profiles.length === 0) {
      console.log("No profiles defined.");
    } else {
      profiles.forEach((p) => {
        console.log(`${p.name}  [${p.contexts.join(", ")}]${p.description ? "  — " + p.description : ""}`);
      });
    }
    return;
  }

  if (command === "get") {
    const name = rest[0];
    if (!name) { console.error("Error: name required"); process.exit(1); }
    const profile = getProfile(baseDir, name);
    console.log(JSON.stringify(profile, null, 2));
    return;
  }

  if (command === "remove") {
    const name = rest[0];
    if (!name) { console.error("Error: name required"); process.exit(1); }
    removeProfile(baseDir, name);
    console.log(`Profile "${name}" removed.`);
    return;
  }

  if (command === "add") {
    const name = rest[0];
    if (!name) { console.error("Error: name required"); process.exit(1); }
    const ctxIdx = rest.indexOf("--contexts");
    if (ctxIdx === -1) { console.error("Error: --contexts required"); process.exit(1); }
    const contexts = rest[ctxIdx + 1]?.split(",").map((s) => s.trim()) ?? [];
    const descIdx = rest.indexOf("--desc");
    const description = descIdx !== -1 ? rest[descIdx + 1] : undefined;
    const dirIdx = rest.indexOf("--base-dir");
    const profileBaseDir = dirIdx !== -1 ? rest[dirIdx + 1] : baseDir;
    const profile: EnvProfile = { name, contexts, baseDir: profileBaseDir, description };
    addProfile(baseDir, profile);
    console.log(`Profile "${name}" saved.`);
    return;
  }

  console.error(`Unknown command: ${command}`);
  printUsage();
  process.exit(1);
}
