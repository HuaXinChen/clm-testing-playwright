import { test, expect } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';

const authStatePath = process.env.AUTH_STATE_PATH ?? 'auth.json';

function storageStateHasCookies(filePath: string): boolean {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as { cookies?: unknown };
    return Array.isArray((parsed as any).cookies) && (parsed as any).cookies.length > 0;
  } catch {
    return false;
  }
}

test.describe('Test group', () => {
  test.skip(
    !existsSync(authStatePath),
    `Missing auth state at ${authStatePath}. Run \`npm run auth\` first.`
  );
  test.skip(
    existsSync(authStatePath) && !storageStateHasCookies(authStatePath),
    `${authStatePath} exists but has no cookies. Re-run \`npm run auth\` to regenerate it.`
  );

  test.use({ storageState: authStatePath });

  test('seed', async ({ page }) => {
    await page.goto('https://app.pandadoc.com/a/#/dashboard', { waitUntil: 'domcontentloaded' });

    await expect(page, 'Expected to land on PandaDoc dashboard when authenticated.').toHaveURL(
      /\/a\/#\/dashboard\b/i
    );
    await expect(page).not.toHaveURL(/\/login\b|accounts\.google\.com/i);
  });
});
