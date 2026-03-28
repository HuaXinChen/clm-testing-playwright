---
name: playwright-locator-audit
description: >
  Playwright locator audit skill that runs tests, analyzes locators against best practices,
  and converts non-semantic selectors to getByRole/getByLabel/getByText equivalents.
  Use when tests fail or when auditing test code for locator quality.
  Relevant files: e2e/**/*.spec.ts, skills/playwright-best-practices/references/.
---

# Playwright Locator Audit

## When to Use This Skill

Invoke this skill when:

- A test fails due to locator issues (element not found, selector broken)
- You want to audit existing tests for locator quality
- You need to convert CSS/XPath selectors to semantic getByRole patterns
- You want to ensure tests follow accessibility best practices

## Trigger Command

```bash
/audit-locators [test-file]
```

- Without `test-file`: audits all spec files in `e2e/`
- With `test-file`: audits specific file (e.g., `/audit-locators e2e/smoke.spec.ts`)

## Workflow

### 1. Run Tests with Analysis

Execute tests using Playwright CLI with locator instrumentation:

```bash
npx playwright test [test-file] --workers=1
```

During execution:

- Capture page snapshots for any failures
- Record which locators were used
- Identify DOM context for each locator

### 2. Locator Analysis

Scan test files for non-best-practice locators:

| Priority   | Locator Type            | Flag            | Action                          |
| ---------- | ----------------------- | --------------- | ------------------------------- |
| **High**   | `locator("//xpath")`    | XPath selector  | Convert to getByText/getByRole  |
| **High**   | `locator("#id")`        | CSS ID selector | Convert to semantic role        |
| **Medium** | `getByTestId("...")`    | Test ID         | Recommend semantic alternative  |
| **Medium** | `locator('input[...]')` | CSS attribute   | Convert to getByRole/getByLabel |
| **Low**    | `locator("body")`       | Generic element | Acceptable for page load checks |

### 3. DOM-Based Recommendations

For each flagged locator:

1. Use Playwright CLI `browser_snapshot` to capture current DOM
2. Identify semantic alternatives from accessibility tree:
   - `getByRole("button", { name: /.../ })` for buttons
   - `getByRole("link", { name: /.../ })` for links
   - `getByRole("textbox", { name: /.../ })` for inputs
   - `getByRole("heading", { name: /.../ })` for headings
   - `getByText("...")` for text content
   - `getByLabel("...")` for form inputs
3. Generate conversion recommendation with DOM context

### 4. Dry-Run Report

Present findings before making changes:

```
┌─────────────────────────────────────────────────────────────┐
│ LOCATOR AUDIT REPORT                                        │
│                                                             │
│ e2e/smoke.spec.ts                                         │
│ ┌─────┬────────────────────────────────────────────────┐   │
│ │ 21  │ locator('input[type="email"]')                 │   │
│ │     │ → getByRole("textbox", { name: /email/i })   │   │
│ └─────┴────────────────────────────────────────────────┘   │
│                                                             │
│ e2e/documents-*.spec.ts                                   │
│ ┌─────┬────────────────────────────────────────────────┐   │
│ │ 15  │ locator("#onetrust-accept-btn-handler")       │   │
│ │     │ → getByRole("button", { name: /accept/i })   │   │
│ └─────┴────────────────────────────────────────────────┘   │
│                                                             │
│ Total: 4 high priority, 2 medium, 0 low                   │
└─────────────────────────────────────────────────────────────┘
```

### 5. User Confirmation

Options:

```
[1] Apply all fixes       - Convert all flagged locators
[2] Apply selected       - Choose which to convert
[3] Dry run only         - Show changes without applying
[4] Skip                 - No changes
```

### 6. Apply & Verify

After user confirmation:

1. Edit test files with converted locators
2. Run tests to verify changes don't break functionality
3. If tests fail after conversion, revert and investigate

### 7. Summary Report

Final output:

```
┌─────────────────────────────────────────────────────────────┐
│ AUDIT COMPLETE                                             │
│                                                             │
│ Files modified: 2                                           │
│ Locators converted: 6                                       │
│ Tests passing: 6/6                                          │
│                                                             │
│ Changes:                                                    │
│ - e2e/smoke.spec.ts: 2 locators converted                 │
│ - e2e/documents-*.spec.ts: 4 locators converted           │
└─────────────────────────────────────────────────────────────┘
```

## What to Load

- `skills/playwright-locator-audit/references/locator-conversion-guide.md` - Conversion patterns
- `skills/playwright-best-practices/references/playwright-best-practices.md` - Best practices reference
- `e2e/fixtures/uiTest.ts` - Test fixture patterns

## Locator Priority (Playwright Best Practices)

From most preferred to least:

1. `getByRole()` - Most semantic and accessible
2. `getByLabel()` - For form inputs with labels
3. `getByPlaceholder()` - For inputs with placeholder text
4. `getByText()` - For text content matching
5. `getByTestId()` - Last resort for unstable UIs
6. CSS selectors - Only when no semantic alternative
7. XPath - Avoid entirely

## Conversion Quick Reference

| From                                     | To                                          | When                  |
| ---------------------------------------- | ------------------------------------------- | --------------------- |
| `locator("#button-id")`                  | `getByRole("button", { name: /.../ })`      | Buttons               |
| `locator('//span[contains(., "text")]')` | `getByText("text")`                         | Text matching         |
| `locator(".class-name")`                 | `getByRole("...")`                          | Based on element type |
| `locator('input[type="text"]')`          | `getByRole("textbox")`                      | Text inputs           |
| `locator("a")`                           | `getByRole("link")`                         | Links                 |
| `locator("input")`                       | `getByRole("textbox")` or `getByLabel(...)` | Form inputs           |

## Defaults to Enforce

- Prefer `getByRole` over CSS/XPath selectors
- Use regex patterns for dynamic text matching
- Avoid `locator("input")` without role context
- Keep `getByTestId` as fallback only
- Never use XPath selectors
- Always verify tests pass after conversion
