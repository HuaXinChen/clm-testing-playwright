import { getAuthSkip, getAuthStatePath } from "./helpers/auth";
import { test, expect } from "./fixtures/uiTest";

test.describe("authenticated", () => {
  const authStatePath = getAuthStatePath();
  const { skip, reason } = getAuthSkip(authStatePath);
  test.skip(skip, reason);
  test.use({ storageState: authStatePath });

  test("authenticated session reaches app without login prompt", async ({ page, baseURL }) => {
    const testInfo = test.info();
    testInfo.annotations.push({ type: "feature", description: "Feature: Authentication" });
    testInfo.annotations.push({ type: "scenario", description: "Scenario: Reuse storageState to access the app" });
    testInfo.annotations.push({
      type: "gherkin",
      description:
        "Given I have an auth storageState\nWhen I navigate to the Discover page\nThen I am not redirected to a login page"
    });

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
