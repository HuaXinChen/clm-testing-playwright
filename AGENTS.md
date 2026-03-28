# Agent Rules

## Git & Version Control

### Commit Rule (CRITICAL)

- **ALWAYS** ask for explicit user permission before running `git commit`
- Before committing:
  1. Show `git status` and `git diff`
  2. Present the commit message
  3. Wait for user confirmation: "[yes/no]"
- **NEVER** auto-commit without user approval
- Exception: Only if user explicitly says "commit this"

### Push Rule

- Ask permission before `git push`
- Warn if pushing to main/master branch
- Recommend PR workflow when appropriate

### Branch Rule

- Ask before creating/deleting branches
- Suggest meaningful branch names

## Test Execution

- Run tests with `--workers=1` for deterministic results
- Always run lint/typecheck after code changes
- Use `/self-heal` when tests fail
- Use `/audit-locators` to maintain locator quality

## Project Structure

- **`e2e/ui/`** - UI/Browser test specs. Use subdirectories to organize by feature.
  - `e2e/ui/smoke/` - Critical path smoke tests
  - `e2e/ui/auth/` - Authentication tests
  - `e2e/ui/documents/` - Document workflow tests
- **`e2e/api/`** - API/HTTP test specs
  - `e2e/api/smoke/` - API smoke tests
  - `e2e/api/contracts/` - Contract analysis API tests
- **`src/fixtures/`** - Test data generators and fixtures. Import into specs.
- **`src/helpers/`** - Utility functions (auth, email handling). Import into specs.
- **`docs/`** - Feature documentation (Markdown specs).
- **`config/`** - Environment config. Do not commit secrets.
- **`skills/`** - AI agent skills. Do not modify unless adding new capabilities.
- **`tools/`** - Scripts (auth, seeding). Run via `npm run`.

## Test Tags

Use tags to categorize tests:

- `@ui` - Browser-based UI tests
- `@api` - HTTP/API tests
- `@smoke` - Smoke tests (critical path)
- `@auth` - Authentication tests
- `@documents` - Document-related tests
- `@contracts` - Contract-related tests

Example: `test.describe("@ui @smoke", () => { ... })`

## Running Tests

| Command                             | Runs                    |
| ----------------------------------- | ----------------------- |
| `npx playwright test e2e/ui`        | All UI tests            |
| `npx playwright test e2e/ui/smoke`  | UI smoke tests          |
| `npx playwright test e2e/api`       | All API tests           |
| `npx playwright test e2e/api/smoke` | API smoke tests         |
| `npx playwright test --grep @smoke` | All tests tagged @smoke |

## File Naming Conventions

| Type       | Pattern     | Example                    |
| ---------- | ----------- | -------------------------- |
| Test specs | `*.spec.ts` | `smoke.spec.ts`            |
| Helpers    | `*.ts`      | `auth.ts`, `mailinator.ts` |
| Fixtures   | `*.ts`      | `uiTest.ts`, `testData.ts` |
| Scripts    | `*.mjs`     | `create-auth-state.mjs`    |

When creating new helpers/fixtures, place in `src/` and import with `../../src/...` from `e2e/ui/` or `e2e/api/`.

## General

- Be concise in responses
- Minimize output unless user requests detail
- Ask for clarification when ambiguous
