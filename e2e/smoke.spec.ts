import { test, expect } from "@playwright/test";

test("loads PandaDoc app and shows login UI", async ({ page, baseURL }) => {
  await page.goto(baseURL ?? "https://app.pandadoc.com", { waitUntil: "domcontentloaded" });

  // The app typically redirects to a login page if unauthenticated.
  await expect(page).toHaveURL(/pandadoc\.com/i);

  const emailInput = page.locator('input[type="email"], input[name="email"], input[id*="email" i]');
  const passwordInput = page.locator(
    'input[type="password"], input[name="password"], input[id*="password" i]'
  );

  try {
    await expect(emailInput).toBeVisible({ timeout: 30_000 });
  } catch {
    await expect(passwordInput).toBeVisible({ timeout: 30_000 });
  }
});
