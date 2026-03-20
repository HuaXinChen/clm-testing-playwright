import { test, expect } from "@playwright/test";
import { getAuthSkip, getAuthStatePath } from "./helpers/auth";

test.describe("seed", () => {
  const authStatePath = getAuthStatePath();
  const { skip, reason } = getAuthSkip(authStatePath);
  test.skip(skip, reason);

  test.use({ storageState: authStatePath });

  test("seed", async ({ page, baseURL }) => {
    const base = (baseURL ?? "https://app.pandadoc.com").replace(/\/+$/, "");
    await page.goto(`${base}/a/#/dashboard`, { waitUntil: "domcontentloaded" });

    await expect(page, "Expected to land on PandaDoc dashboard when authenticated.").toHaveURL(
      /\/a\/#\/dashboard\b/i
    );
    await expect(page).not.toHaveURL(/\/login\b|accounts\.google\.com/i);
  });
});
