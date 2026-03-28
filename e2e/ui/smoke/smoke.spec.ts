import { test, expect } from "../../../src/fixtures/uiTest";

test.describe("@ui @smoke", () => {
  test("unauthenticated user sees login UI", async ({ page, baseURL }) => {
    const testInfo = test.info();
    testInfo.annotations.push({ type: "feature", description: "Feature: Authentication" });
    testInfo.annotations.push({
      type: "scenario",
      description: "Scenario: Unauthenticated user is prompted to log in"
    });
    testInfo.annotations.push({
      type: "gherkin",
      description:
        "Given I am not authenticated\nWhen I open the PandaDoc app\nThen I see the login UI"
    });

    await page.goto(baseURL ?? "https://app.pandadoc.com", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/pandadoc\.com/i);

    await expect(page.getByRole("heading", { name: /log in to pandadoc/i })).toBeVisible({
      timeout: 30_000
    });
  });
});
