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
- Prefer asserting observable outcomes over internal implementation:
  - URL, headings, toasts, table rows, disabled states, etc.
- Avoid global ordering:
  - No “depends on previous test”. If needed, factor shared setup into a fixture.

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

- Use fixtures to share *setup*, not to hide assertions.
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
- Replace sleeps with assertions:
  - “wait for navigation”: `await expect(page).toHaveURL(...)`
  - “wait for fetch results”: assert the UI state change that indicates completion
  - “wait for dialog”: `await page.getByRole(...).waitFor()` (or `expect(...).toBeVisible()`)
- Remove ambiguity:
  - Add scopes, use role-based locators, or introduce `data-testid` in the app if possible.

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
- `playwright/.user-data/`, `playwright/.auth/`, `playwright/.cache/` (if used)
- auth state file (e.g., `auth.json`)
- `.env`

Avoid:

- Committing traces/videos (unless you intentionally store them as build artifacts only).
- Leaking tenant URLs, credentials, or tokens in logs. Redact where necessary.
