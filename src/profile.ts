import * as fs from "fs";
import * as path from "path";

export interface EnvProfile {
  name: string;
  contexts: string[];
  baseDir: string;
  schema?: string;
  description?: string;
}

export interface ProfileMap {
  [name: string]: EnvProfile;
}

const PROFILE_FILE = ".envchain-profiles.json";

export function profileFilePath(baseDir: string): string {
  return path.join(baseDir, PROFILE_FILE);
}

export function loadProfiles(baseDir: string): ProfileMap {
  const filePath = profileFilePath(baseDir);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as ProfileMap;
}

export function saveProfiles(baseDir: string, profiles: ProfileMap): void {
  const filePath = profileFilePath(baseDir);
  fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2) + "\n", "utf-8");
}

export function addProfile(baseDir: string, profile: EnvProfile): ProfileMap {
  const profiles = loadProfiles(baseDir);
  profiles[profile.name] = profile;
  saveProfiles(baseDir, profiles);
  return profiles;
}

export function removeProfile(baseDir: string, name: string): ProfileMap {
  const profiles = loadProfiles(baseDir);
  if (!(name in profiles)) {
    throw new Error(`Profile "${name}" not found`);
  }
  delete profiles[name];
  saveProfiles(baseDir, profiles);
  return profiles;
}

export function getProfile(baseDir: string, name: string): EnvProfile {
  const profiles = loadProfiles(baseDir);
  if (!(name in profiles)) {
    throw new Error(`Profile "${name}" not found`);
  }
  return profiles[name];
}

export function listProfiles(baseDir: string): EnvProfile[] {
  return Object.values(loadProfiles(baseDir));
}
