import { existsSync, readFileSync } from "node:fs";

export function getAuthStatePath(): string {
  return process.env.AUTH_STATE_PATH ?? "auth.json";
}

export function storageStateHasCookies(filePath: string): boolean {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { cookies?: unknown };
    return Array.isArray((parsed as any).cookies) && (parsed as any).cookies.length > 0;
  } catch {
    return false;
  }
}

export function getAuthSkip(filePath: string): { skip: boolean; reason?: string } {
  if (!existsSync(filePath)) {
    return {
      skip: true,
      reason: `Missing auth state at ${filePath}. Run \`npm run auth\` first.`
    };
  }

  if (!storageStateHasCookies(filePath)) {
    return {
      skip: true,
      reason: `${filePath} exists but has no cookies. Re-run \`npm run auth\` to regenerate it.`
    };
  }

  return { skip: false };
}
