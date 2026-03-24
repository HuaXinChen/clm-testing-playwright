import { getAuthSkip, getAuthStatePath } from "./helpers/auth";
import { test, expect } from "./fixtures/uiTest";

test.describe("seed", () => {
  const authStatePath = getAuthStatePath();
  const { skip, reason } = getAuthSkip(authStatePath);
  test.skip(skip, reason);

  test.use({ storageState: authStatePath });

  test("seed: authenticated user lands on dashboard", async ({ page, baseURL }) => {
    const testInfo = test.info();
    testInfo.annotations.push({ type: "feature", description: "Feature: Environment" });
    testInfo.annotations.push({
      type: "scenario",
      description: "Scenario: Seed prerequisites for e2e flows"
    });
    testInfo.annotations.push({
      type: "gherkin",
      description:
        "Given I have a valid authenticated session\nWhen I open the PandaDoc dashboard\nThen the dashboard loads successfully"
    });

    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    await page.goto(`${base}/a/#/dashboard`, { waitUntil: "domcontentloaded" });

    await expect(page, "Expected to land on PandaDoc dashboard when authenticated.").toHaveURL(
      /\/a\/#\/dashboard\b/i
    );
    await expect(page).not.toHaveURL(/\/login\b|accounts\.google\.com/i);
  });
});
