import { test, expect } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const authStatePath = process.env.AUTH_STATE_PATH ?? "auth.json";
const hasAuthState = existsSync(authStatePath);

function storageStateHasCookies(filePath: string): boolean {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { cookies?: unknown };
    return Array.isArray((parsed as any).cookies) && (parsed as any).cookies.length > 0;
  } catch {
    return false;
  }
}

test.describe("authenticated", () => {
  test.skip(
    !hasAuthState,
    `Missing auth state at ${authStatePath}. Run \`npm run auth\` first.`
  );
  test.skip(
    hasAuthState && !storageStateHasCookies(authStatePath),
    `${authStatePath} exists but has no cookies. Re-run \`npm run auth\` to regenerate it.`
  );
  test.use({ storageState: authStatePath });

  test("authenticated session reaches app without login prompt", async ({ page, baseURL }) => {
    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    const expectedDiscoverUrl = `${base}/a/#/discover`;
    await page.goto(expectedDiscoverUrl, { waitUntil: "domcontentloaded" });

    // If the auth state is valid, we should not land back on a login page.
    await expect(page, "Auth state did not produce a logged-in session. Re-run `npm run auth`.").not.toHaveURL(
      /\/login\b|accounts\.google\.com/i
    );
    await expect(page).toHaveURL(/\/a\/#\/discover\b/i);

    // Best-effort: app shell has rendered (not a blank/redirecting page).
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
