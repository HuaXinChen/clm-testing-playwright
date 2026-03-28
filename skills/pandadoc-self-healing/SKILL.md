---
name: pandadoc-self-healing
description: >
  E2E test self-healing skill for Playwright tests targeting the Pandadoc web app.
  Use when tests fail locally (non-CI) and you need to diagnose, classify, and resolve
  failures. The skill analyzes test artifacts, classifies failures, attempts automated fixes,
  and optionally creates GitHub issues for valid bugs or updates tests for expected behavior.
  Relevant files: e2e/**/*.spec.ts, test-results/, known-issues.json, playwright.config.ts.
---

# Pandadoc E2E Test Self-Healing

## When to Use This Skill

Invoke this skill when:

- A Playwright test fails during local development
- You want to diagnose why a test is failing
- You need to determine if a failure is a bug or expected behavior
- You want to automatically create GitHub issues for valid bugs
- You need to update tests to handle expected application changes

## Trigger Commands

**Manual trigger:**

```bash
/self-heal [test-file]
```

**Auto trigger after test failure:**

```bash
npx playwright test || npx opencode /self-heal
```

## Workflow

### 1. Check Known Issues

Read `known-issues.json` and match the current error against existing patterns.

- **Match found + autoAction enabled**: Apply the configured action automatically and notify the user
- **Match found + no autoAction**: Prompt user with the suggested action pre-filled
- **No match**: Proceed to flaky detection

### 2. Flaky Detection

Re-run the failing test in isolation (single worker mode).

- **If test passes on retry**: Classify as "flaky"
  - Suggest stabilization (add retries, increase timeout, add explicit waits)
  - Add to `known-issues.json` with resolution type "stabilization"
  - Do NOT create GitHub issue
  - Informational notification only

- **If test still fails**: Proceed to artifact reading and classification

### 3. Read Test Artifacts

From `test-results/` directory:

- Screenshot (from `uiTest.ts` attachment or Playwright default naming)
- Page URL from test attachment
- Console logs if available

**Fallback chain for screenshot:**

1. `test-results/<test-name>.png` (from uiTest.ts)
2. `test-results/**/<test-name>*.png` (Playwright default)
3. Playwright MCP `browser_snapshot`
4. Proceed without visual, note "screenshot unavailable"

### 4. Failure Classification

Classify the failure into one of these categories:

| Classification  | Criteria                               | Auto-Fixable          |
| --------------- | -------------------------------------- | --------------------- |
| Selector Change | Element not found, locator broken      | Yes (High confidence) |
| Timing Issue    | Timeout, element not visible           | Yes (with wait/retry) |
| Environment     | Auth expired, network error            | Partial               |
| Data/State      | Missing test data, precondition failed | No                    |
| Application Bug | Assertion fails on valid state         | No                    |
| Flaky           | Intermittent, passes on retry          | N/A                   |

Include a confidence score (High/Medium/Low) for each classification.

### 5. Automated Fix Attempt

For fixable issues (Selector Change, Timing, Environment):

- Use Playwright MCP tools to:
  - Generate alternative locators
  - Suggest wait/timeout adjustments
  - Identify re-authentication steps
- Apply fix if confidence is High
- If fix works: Apply automatically, log to `known-issues.json`, notify user
- If automated fix fails: Escalate to user confirmation

### 6. User Confirmation

Present to the user:

- Screenshot from test artifacts
- Error message and stack trace
- Failure classification with confidence
- Suggested cause
- Result of auto-fix attempt (if applicable)

**Options:**

```
[1] Valid Bug      → Create GitHub issue with details
[2] Expected       → Show update options (skip, update assertion, add wait)
[3] Remember       → Add to known-issues with pre-selected action
[4] Skip           → test.skip() + known-issues.json
```

### 7. GitHub Issue Creation (for Valid Bugs)

Before creating, check for duplicates:

```bash
gh issue list --label test-fix-needed --state open
```

- **Duplicate found**: Add comment with new failure details, link to existing issue
- **No duplicate**: Create issue with:
  - Label: `test-fix-needed`
  - Title: `E2E Test Failure: <test-name>`
  - Body: Description, error details, screenshot, context

### 8. Test Updates (for Expected Behavior)

Options to offer:

- `test.skip()` with reason comment
- Update assertion to match new behavior
- Add explicit wait/retry logic
- Add to `known-issues.json` without code change

### 9. Update known-issues.json

Always log the resolution to `known-issues.json`:

```json
{
  "id": "uuid",
  "pattern": "regex to match error",
  "classification": "...",
  "testFile": "path/to/test.spec.ts",
  "description": "Human readable description",
  "resolution": {
    "type": "skip|assertion|wait|known-issue|stabilization",
    "action": "Details of resolution"
  },
  "autoAction": {
    "enabled": false,
    "action": "skip",
    "applyWithoutAsking": false
  },
  "relatedGithubIssue": null,
  "detectedAt": "ISO timestamp",
  "resolved": false,
  "lastSeen": "ISO timestamp"
}
```

## What to Load

- `skills/pandadoc-self-healing/references/failure-classification.md` - Classification decision tree and resolution templates
- `skills/pandadoc-self-healing/agents/pandadoc-test-self-healer.agent.md` - Full agent instructions
- `known-issues.json` - Existing known issues
- `e2e/fixtures/uiTest.ts` - Test fixture patterns
- `playwright.config.ts` - Test configuration

## Batch Failure Handling

When multiple tests fail:

1. Run all failing tests in isolation sequentially
2. Group by classification
3. For similar failures: Single prompt with "Apply to all N similar failures"
4. For unique failures: Individual prompts
5. Summary report after all decisions

## Defaults to Enforce

- Always read test artifacts before diagnosing
- Check `known-issues.json` before creating new GitHub issues
- Attempt automated fix before prompting user (for high-confidence cases)
- Never create GitHub issues for flaky tests
- Log all resolutions to `known-issues.json`
- Use `gh` CLI for GitHub interactions
