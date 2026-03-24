# Playwright automation best practices (checklist + patterns)

## Contents

1. Project structure
2. Config defaults
3. Test design
4. Locators and selectors
5. Fixtures and helpers
6. Authentication and storageState (Google SSO)
7. Debugging and flake triage
8. CI hardening
9. Repo hygiene and safety

## 1) Project structure

- Keep tests in a dedicated folder (`e2e/` or `tests/`) and use `testDir` in `playwright.config.*`.
- Prefer a small number of clearly scoped specs over one mega-spec.
- Keep “support” code in a predictable place (e.g., `e2e/fixtures/`, `e2e/pages/`, `e2e/helpers/`).

## 2) Config defaults

- Use Allure for reporting:
  - Configure `allure-playwright` in `reporter` (keep the HTML reporter too for quick local triage).
  - Write Allure results to `allure-results/` and publish an Allure report artifact in CI.
- Use artifacts that help debugging flakes:
  - `trace: "on-first-retry"`
  - `screenshot: "only-on-failure"`
  - `video: "retain-on-failure"`
- Keep `timeout` reasonable globally; tune per-test when needed rather than inflating everything.
- Use `retries` only in CI; if a test needs retries locally, it’s probably flaky.

## 3) Test design

- Aim for:
  - **One reason to fail** per test.
  - Clear arrange/act/assert flow.
  - Deterministic data (seeded or explicitly created) rather than relying on ambient state.
- Playwright annotations are required for every test (use them for reporting and triage; do not call Allure APIs directly in tests):
  - Add `feature` and `scenario` as annotations via `test.info().annotations`.
  - Keep a Gherkin-style convention so reports read like specs:
    - `feature`: `Feature: <domain/capability>`
    - `scenario`: `Scenario: <behavior/outcome>`
    - (Optional) `gherkin`: multi-line `Given/When/Then` text for the full scenario.
  - Use a meaningful test title (it becomes your “default” Allure test name and is what you’ll scan first in reports).
- Prefer asserting observable outcomes over internal implementation:
  - URL, headings, toasts, table rows, disabled states, etc.
- Avoid global ordering:
  - No “depends on previous test”. If needed, factor shared setup into a fixture.

Minimal pattern:

```ts
import { test, expect } from "@playwright/test";

test("creates an invoice with a line item", async ({ page }) => {
  const testInfo = test.info();
  testInfo.annotations.push({ type: "feature", description: "Feature: Billing - Invoicing" });
  testInfo.annotations.push({
    type: "scenario",
    description: "Scenario: Create an invoice with a line item"
  });
  testInfo.annotations.push({
    type: "gherkin",
    description:
      "Given I am an authenticated user\nWhen I create an invoice with one line item\nThen the invoice is saved and visible in the list"
  });
  // ...
});
```

## 4) Locators and selectors

Locator preference order (most stable first):

1. `getByRole(...)` with accessible name
2. `getByLabel(...)`, `getByPlaceholder(...)`, `getByText(...)` (careful with ambiguous text)
3. `getByTestId(...)` (when product supports it)
4. CSS selectors (last resort)

Patterns:

- Always scope ambiguous queries:
  - Prefer `container.getByRole(...)` over `page.getByRole(...)` when there are multiple similar regions.
- Avoid `nth()` unless the UI truly requires it; it’s fragile.
- Avoid XPath unless there’s no alternative.

## 5) Fixtures and helpers

- Use fixtures to share _setup_, not to hide assertions.
- Keep helper functions pure where possible: pass in `page` and return values rather than mutating global state.
- Use `test.step(...)` for multi-stage flows to improve trace readability.

## 6) Authentication and storageState (Google SSO)

Preferred approach:

- Do a **manual, one-time login** in a headed browser.
- Save `storageState` to a file (e.g., `auth.json`).
- Load `storageState` in authenticated tests.

Google SSO specifics:

- Prefer launching **real Chrome** using Playwright’s `channel: "chrome"` to reduce Google “insecure browser/app” blocks.
- Expect friction with:
  - 2FA prompts
  - device approval
  - reCAPTCHA challenges
  - third-party cookie restrictions
- Keep a dedicated persistent profile directory (e.g., `playwright/.user-data/`) and allow users to reset it when sign-in gets wedged.

Safety:

- Never commit `auth.json` or any persistent user profile directory.
- Do not store real passwords or MFA secrets in `.env` or source control.

## 7) Debugging and flake triage

When a test flakes:

- Check trace first; identify the first unexpected state transition.
- Ensure every failure path attaches something actionable:
  - UI failures: attach a screenshot (or rely on `screenshot: "only-on-failure"` plus an explicit attach when you catch/rethrow).
  - API/assertion failures: attach the last relevant API response (status + body) as JSON/text.
- Replace sleeps with assertions:
  - “wait for navigation”: `await expect(page).toHaveURL(...)`
  - “wait for fetch results”: assert the UI state change that indicates completion
  - “wait for dialog”: `await page.getByRole(...).waitFor()` (or `expect(...).toBeVisible()`)
- Remove ambiguity:
  - Add scopes, use role-based locators, or introduce `data-testid` in the app if possible.

Failure-attach pattern (works with both Playwright HTML and Allure reporters):

```ts
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    await testInfo.attach("screenshot", {
      body: await page.screenshot(),
      contentType: "image/png"
    });
  }
});
```

## 8) CI hardening

- Ensure CI collects artifacts:
  - upload `playwright-report/` and `test-results/` on failure (or always for short-lived pipelines)
- Run in a clean environment:
  - avoid relying on a long-lived cached login state unless explicitly designed
- Keep retries low; if retries hide real failures, fix the root flake.

## 9) Repo hygiene and safety

`.gitignore` should include at least:

- `node_modules/`
- `playwright-report/`, `test-results/`, `blob-report/`
- `allure-results/`, `allure-report/`
- `playwright/.user-data/`, `playwright/.auth/`, `playwright/.cache/` (if used)
- auth state file (e.g., `auth.json`)
- `.env`

Avoid:

- Committing traces/videos (unless you intentionally store them as build artifacts only).
- Leaking tenant URLs, credentials, or tokens in logs. Redact where necessary.

Code quality:

- Let Prettier handle formatting (run `npm run format`).
- Let ESLint handle code quality (run `npm run lint`).
- Do not enable ESLint rules that fight Prettier; prefer `eslint-config-prettier`.
