import { readFileSync } from "node:fs";
import * as path from "node:path";

export type EnvConfig = {
  pandadocBaseUrl: string;
  mailinatorBaseUrl: string;
};

let cachedConfig: EnvConfig | undefined;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

function readEnvJson(): Partial<EnvConfig> {
  const filePath = path.resolve(process.cwd(), "env.json");
  try {
    const raw = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<EnvConfig>;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function getEnvConfig(): EnvConfig {
  if (cachedConfig) return cachedConfig;

  const fromJson = readEnvJson();

  const pandadocBaseUrl = normalizeBaseUrl(
    process.env.BASE_URL ?? fromJson.pandadocBaseUrl ?? "https://app.pandadoc.com"
  );
  const mailinatorBaseUrl = normalizeBaseUrl(
    process.env.MAILINATOR_BASE_URL ?? fromJson.mailinatorBaseUrl ?? "https://www.mailinator.com"
  );

  cachedConfig = { pandadocBaseUrl, mailinatorBaseUrl };
  return cachedConfig;
}
