import "dotenv/config";
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.BASE_URL ?? "https://app.pandadoc.com";
const authPath = process.env.AUTH_STATE_PATH ?? "auth.json";

const dashboardUrlPattern = process.env.DASHBOARD_URL_PATTERN ?? "**/discover**";
const channel = process.env.BROWSER_CHANNEL ?? "chrome";
const userDataDir = process.env.USER_DATA_DIR ?? "playwright/.user-data";

(async () => {
  await mkdir(path.dirname(authPath), { recursive: true }).catch(() => {});
  await mkdir(userDataDir, { recursive: true }).catch(() => {});

  let context;
  try {
    // Use real Chrome by default to avoid Google's "This browser or app may not be secure" block
    // that commonly triggers on automation-controlled Chromium builds.
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      channel,
      // Best-effort reduction of automation signals; Google may still block automated flows.
      ignoreDefaultArgs: ["--enable-automation"],
      args: ["--disable-blink-features=AutomationControlled"]
    });
  } catch (err) {
    const message = String(err?.message ?? err);
    if (message.toLowerCase().includes("channel")) {
      console.error(
        `Failed to launch browser channel "${channel}". ` +
          `Set BROWSER_CHANNEL=chrome (recommended) or omit it if Chrome isn't installed.`
      );
    }
    throw err;
  }

  const page = context.pages()[0] ?? (await context.newPage());
  await context.addInitScript(() => {
    // Best-effort: hide webdriver flag. Some IdPs still detect automation.
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  console.log(`Opening: ${baseURL}`);
  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  console.log("Complete Google sign-in manually in the opened browser window.");
  console.log(`Waiting for URL: ${dashboardUrlPattern}`);
  await page.waitForURL(dashboardUrlPattern, { timeout: 10 * 60_000 });

  await context.storageState({ path: authPath });
  console.log(`Saved storageState to: ${authPath}`);

  await context.close();
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
