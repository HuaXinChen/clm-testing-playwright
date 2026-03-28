import { test as base, expect } from "@playwright/test";

export const test = base;
export { expect };

test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status === testInfo.expectedStatus) return;
  await testInfo.attach("screenshot", {
    body: await page.screenshot({ fullPage: true }),
    contentType: "image/png"
  });
  await testInfo.attach("page-url", {
    body: Buffer.from(page.url(), "utf8"),
    contentType: "text/plain"
  });
});
