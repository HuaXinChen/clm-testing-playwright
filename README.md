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

### Google login setup (Required)

This repo’s auth flow is **manual Google sign-in** in a headed browser, then tests reuse the saved session cookies from `AUTH_STATE_PATH` (default: `auth.json`).

Before running `npm run auth`:

- Install **Google Chrome** locally (recommended).
- If your org enforces 2FA, device approval, or reCAPTCHA, be ready to complete it in the opened browser window.
- If Google sign-in loops or pages render blank, temporarily allow third-party cookies for `accounts.google.com` / `app.pandadoc.com` in Chrome settings and retry.

Run the interactive auth script (opens a headed browser):

```bash
npm run auth
```

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
