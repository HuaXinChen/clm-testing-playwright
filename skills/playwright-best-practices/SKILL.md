---
name: playwright-best-practices
description: >
  Best-practice workflow and review checklist for Playwright automation projects
  (TypeScript/JavaScript). Use when creating, refactoring, debugging, stabilizing,
  or reviewing Playwright E2E tests, including test structure, fixtures, locators,
  auth/storageState login flows (Google SSO/2FA), CI reliability, reporting/artifacts,
  and repo hygiene (.gitignore, secrets, env vars). Relevant files include
  playwright.config.*, package.json, *.spec.ts/*.test.ts, test/ and e2e/ folders,
  GitHub Actions workflows, and auth/session state files (e.g., auth.json,
  playwright/.user-data).
---

# Playwright Best Practices

## Workflow

Apply a consistent workflow to make Playwright suites reliable, maintainable, and CI-friendly, with minimal, reviewable diffs.

### 1) Triage the request

- Confirm whether the goal is **new tests**, **stabilization**, **auth setup**, **CI hardening**, or a **code review**.
- Identify the runner and layout: `@playwright/test`, `playwright.config.*`, and the test folder (`e2e/`, `tests/`, etc.).

### 2) Establish reliability guardrails

- Prefer **explicit waits** via Playwright’s auto-waiting + `expect(...)`, avoid `waitForTimeout`.
- Make tests **isolated** (no ordering dependency), and deterministic (seeded test data where possible).
- Minimize flake sources: stable locators, clear navigation assertions, and tight timeouts only where safe.

### 3) Handle authentication intentionally

- If auth is required, prefer a **manual, one-time login** that saves `storageState`, then reuse it in tests.
- Ensure auth artifacts are **not committed** (e.g., `/auth.json`, `playwright/.user-data/`).
- For Google SSO: run login in **real Chrome** when possible (via Playwright channel) and be prepared for 2FA/device approval.

### 4) Implement with maintainability in mind

- Use fixtures for shared setup; avoid large “god” page objects.
- Use `test.step(...)` to document multi-stage flows and improve trace readability.
- Keep selectors centralized when a product UI changes frequently.

### 5) Validate the change

- Run the narrowest relevant command first (single spec / project) before full suite.
- Ensure artifacts are retained on failure (trace/video/screenshot) in CI.

## What to Load

- For the detailed checklist and patterns, read `references/playwright-best-practices.md`.

## Defaults to Enforce

- Prefer `getByRole`/`getByLabel`/`getByTestId` locators over brittle CSS/xpath.
- Prefer explicit navigation assertions: `await expect(page).toHaveURL(...)`.
- Avoid fixed sleeps; rely on assertions and auto-waiting.
- Keep secrets out of the repo; use `.env`/CI secrets; ignore auth state in git.
