import { getAuthSkip, getAuthStatePath } from "../../../src/helpers/auth";
import { test, expect } from "../../../src/fixtures/uiTest";

test.describe("@ui @auth", () => {
  const authStatePath = getAuthStatePath();
  const { skip, reason } = getAuthSkip(authStatePath);

  test.skip(skip, reason);
  test.use({ storageState: authStatePath });

  test("authenticated session reaches app without login prompt", async ({ page, baseURL }) => {
    const testInfo = test.info();
    testInfo.annotations.push({ type: "feature", description: "Feature: Authentication" });
    testInfo.annotations.push({
      type: "scenario",
      description: "Scenario: Reuse storageState to access the app"
    });
    testInfo.annotations.push({
      type: "gherkin",
      description:
        "Given I have an auth storageState\nWhen I navigate to the Discover page\nThen I am not redirected to a login page"
    });

    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    const expectedDiscoverUrl = `${base}/a/#/discover`;
    await page.goto(expectedDiscoverUrl, { waitUntil: "domcontentloaded" });

    await expect(
      page,
      "Auth state did not produce a logged-in session. Re-run `npm run auth`."
    ).not.toHaveURL(/\/login\b|accounts\.google\.com/i);
    await expect(page).toHaveURL(/\/a\/#\/discover\b/i);

    await expect(page.locator("body")).not.toBeEmpty();
  });
});
