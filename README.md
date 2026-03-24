## Overview

This project demonstrates an end-to-end test strategy for a Contract Lifecycle Management (CLM) workflow using Playwright.

It focuses on validating complex, asynchronous document workflows including:
- Document creation from templates
- Dynamic recipient handling
- Email-based verification (Mailinator)
- Document signing flows

## Key Testing Strategies

- **Resilient selectors** using role-based and test-id locators
- **Async validation** using network interception and email polling
- **End-to-end workflow validation** across multiple systems (UI + email)
- **State reuse** via authenticated session storage

## Why this matters

CLM platforms involve distributed workflows and external dependencies (email delivery, document rendering, signing flows).  
This project demonstrates how to validate such systems reliably in an automated pipeline.

# clm-testing-playwright

Playwright test project for `https://app.pandadoc.com/` (PandaDoc CLM).

## Quick start

1) Install deps and browsers:

```bash
npm i
npx playwright install --with-deps
```

2) Run smoke tests (no auth required):

```bash
npm test smoke.spec.ts
```

## Environment URLs

Default endpoints live in `env.json` (override with `.env` if needed):

- PandaDoc base URL: `BASE_URL`
- Mailinator base URL: `MAILINATOR_BASE_URL`

## Formatting and linting

- Format (Prettier): `npm run format` (check-only: `npm run format:check`)
- Lint (ESLint): `npm run lint` (auto-fix: `npm run lint:fix`)

## Allure reporting

1) Run tests (Allure results are written to `allure-results/`):

```bash
npm test
```

2) Generate a static report into `allure-report/`:

```bash
npm run allure:generate
```

3) Open the report locally:

```bash
npm run allure:open
```

If `allure:generate` fails, ensure Java is installed and available on your PATH.

### Google login setup (Required)

This repo’s auth flow is **manual Google sign-in** in a headed browser, then tests reuse the saved session cookies from `AUTH_STATE_PATH` (default: `auth.json`).

Before running `npm run auth`:

- Create a local `.env` (recommended): `cp .env.example .env`
- Install **Google Chrome** locally (recommended).
- If your org enforces 2FA, device approval, or reCAPTCHA, be ready to complete it in the opened browser window.
- If Google sign-in loops or pages render blank, temporarily allow third-party cookies for `accounts.google.com` / `app.pandadoc.com` in Chrome settings and retry.

Run the interactive auth script (opens a headed browser):

```bash
npm run auth
```

#### Creating a new PandaDoc account with Google (first-time login)

If you’re starting from a brand-new PandaDoc account, complete the onboarding in the opened browser:

1) Run `npm run auth`
2) Choose **Google Login**
3) Sign in with your Google account
4) Choose the **Free** plan
5) Choose **Job Offer Letter Template**
6) When the browser lands on the **Discover** page, the auth session is saved to `auth.json`

Note: the auth script saves state when the URL matches `DASHBOARD_URL_PATTERN` from `.env`. If your tenant lands on Discover, set `DASHBOARD_URL_PATTERN=**/a/#/discover**` and re-run `npm run auth`.

If Google shows “This browser or app may not be secure”, ensure you’re using real Chrome:

If you still get blocked, try resetting the dedicated Playwright profile and re-auth:

```bash
rm -rf playwright/.user-data auth.json
npm run auth
```

(On Windows, delete `playwright/.user-data` and `auth.json` manually, then re-run `npm run auth`.)

Then run authenticated tests:

```bash
npm run test:auth
```
