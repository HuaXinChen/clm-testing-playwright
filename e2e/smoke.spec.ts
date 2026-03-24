import { test, expect } from "./fixtures/uiTest";

test("unauthenticated user sees login UI", async ({ page, baseURL }) => {
  const testInfo = test.info();
  testInfo.annotations.push({ type: "feature", description: "Feature: Authentication" });
  testInfo.annotations.push({ type: "scenario", description: "Scenario: Unauthenticated user is prompted to log in" });
  testInfo.annotations.push({
    type: "gherkin",
    description: "Given I am not authenticated\nWhen I open the PandaDoc app\nThen I see the login UI"
  });

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
