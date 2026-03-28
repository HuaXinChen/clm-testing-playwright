# Failure Classification Reference

## Classification Decision Tree

```
START: Test Failed
│
├── Is error about element not found?
│   │
│   ├── YES → Is the locator using dynamic data (regex/timestamp)?
│   │         │
│   │         ├── YES → Selector Change (regex-based locator needed)
│   │         │
│   │         └── NO → Is there an alternative locator available?
│   │                   │
│   │                   ├── YES → Selector Change (update locator)
│   │                   │
│   │                   └── NO → Application Bug (element removed/changed)
│   │
│   └── NO ↓
│
├── Did operation timeout?
│   │
│   ├── YES → Is the element present but not actionable?
│   │         │
│   │         ├── YES → Timing Issue (add wait/retry)
│   │         │
│   │         └── NO → Timing Issue (increase timeout)
│   │
│   └── NO ↓
│
├── Is error about authentication/session?
│   │
│   ├── YES → Environment (auth expired or invalid)
│   │
│   └── NO ↓
│
├── Is error about network/connection?
│   │
│   ├── YES → Environment (network issue)
│   │
│   └── NO ↓
│
├── Is error about test data or fixtures?
│   │
│   ├── YES → Data/State (missing test data or precondition)
│   │
│   └── NO ↓
│
└── Assertion failed?
    │
    ├── YES → Is the application behavior expected?
    │         │
    │         ├── YES → Expected Behavior (update test)
    │         │
    │         └── NO → Application Bug (create GitHub issue)
    │
    └── NO → Unknown (investigate further)
```

## Classification Definitions

### 1. Selector Change

**Definition:** The UI element exists but the test's locator no longer matches it.

**Indicators:**

- `locator.*not found`
- `element.*not found`
- `querySelector.*returned null`
- `getBy.*did not match`

**Common Causes:**

- UI element renamed or moved
- CSS class/id changed
- Text content changed
- Data-testid removed or renamed
- Dynamic content breaks static locators

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Alternative locator available | Yes | Partial | No |
| Element visible in DOM | Yes | Yes | No |
| Similar pattern in codebase | Multiple | One | None |

**Auto-fix Strategy:**

1. Use `browser_generate_locator` to find alternatives
2. Prefer: `getByRole` > `getByLabel` > `getByText` > CSS
3. For dynamic data: wrap in regex pattern
4. Apply and verify

**Resolution Template:**

```json
{
  "type": "locator-update",
  "action": "Changed locator from 'old-selector' to 'new-selector'",
  "autoFixable": true
}
```

### 2. Timing Issue

**Definition:** The element exists but is not ready when the test attempts to interact with it.

**Indicators:**

- `timeout.*exceeded`
- `timeout.*waiting`
- `not visible`
- `not actionable`
- `not enabled`
- `animation.*incomplete`

**Common Causes:**

- Slow network response
- Heavy JavaScript rendering
- Animation transitions
- Lazy loading
- Race conditions

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Element exists in DOM | Yes | Yes | No |
| Timing is consistent | Yes | Sometimes | No |
| Wait strategy works | Yes | Partial | No |

**Auto-fix Strategy:**

1. Add `await expect(locator).toBeVisible()` before interaction
2. Add `await page.waitForLoadState('networkidle')` sparingly
3. Increase `expect` timeout in test
4. Add retry wrapper for flaky timing

**Resolution Template:**

```json
{
  "type": "wait",
  "action": "Added explicit wait: await expect(locator).toBeVisible()",
  "autoFixable": true
}
```

### 3. Environment

**Definition:** Test failure due to external factors like authentication, network, or infrastructure.

**Indicators:**

- `auth.*expired`
- `auth.*invalid`
- `cookie.*not found`
- `session.*expired`
- `network.*error`
- `ECONNREFUSED`
- `timeout.*server`
- `ENOTFOUND`

**Common Causes:**

- Auth token expired
- Session cookies invalid
- Network connectivity issues
- DNS resolution failure
- Server unavailable

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Error is clearly network-related | Yes | No | - |
| Auth error pattern matches | Yes | Partial | No |
| Retry succeeds | Yes | - | No |

**Auto-fix Strategy:**

1. For auth issues: Prompt to regenerate auth state
2. For network issues: Retry with exponential backoff
3. For transient issues: Add retry logic

**Resolution Template:**

```json
{
  "type": "environment",
  "action": "Regenerate auth state with 'npm run auth'",
  "autoFixable": false
}
```

### 4. Data/State

**Definition:** Test failure due to missing or incorrect test data, or prerequisite state not established.

**Indicators:**

- `fixture.*not found`
- `test data.*missing`
- `precondition.*failed`
- `seed.*required`
- `data.*not found`
- `mock.*not set`

**Common Causes:**

- Test data not seeded
- Dependent test failed and left bad state
- Fixture file missing
- Test data generator issue
- API returning different data

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Missing data clearly identified | Yes | Partial | No |
| Seeding mechanism available | Yes | No | - |
| Error message indicates data | Yes | No | No |

**Auto-fix Strategy:**

1. Run seed test first: `npx playwright test seed.spec.ts`
2. Verify test data generator
3. Mock missing data if possible

**Resolution Template:**

```json
{
  "type": "data",
  "action": "Run 'npx playwright test seed.spec.ts' before this test",
  "autoFixable": false
}
```

### 5. Application Bug

**Definition:** The application has changed behavior and the test correctly detected it.

**Indicators:**

- `expect.*toBe`
- `expect.*toEqual`
- `expect.*toContain`
- `assertion.*failed`
- `expected.*actual`
- `strict equal`

**Common Causes:**

- Feature behavior changed
- Bug introduced in application
- Breaking change in API
- UI redesign

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Assertion clearly fails | Yes | - | No |
| Application behavior changed | Yes | Possible | No |
| Test expectation is correct | Yes | Unclear | No |

**Auto-fix Strategy:**

1. User confirmation required
2. Create GitHub issue for bug
3. Update test temporarily with `test.skip()`

**Resolution Template:**

```json
{
  "type": "bug",
  "action": "GitHub issue created for investigation",
  "autoFixable": false
}
```

### 6. Flaky

**Definition:** Test fails intermittently but passes on retry without any changes.

**Indicators:**

- Test passes when run alone
- Test fails in parallel runs
- Failure is inconsistent
- Network-related timing variations

**Common Causes:**

- Test pollution from parallel tests
- Shared state not isolated
- Race conditions
- Unreliable assertions
- Resource contention

**Confidence Scoring:**
| Factor | High | Medium | Low |
|--------|------|--------|-----|
| Passes on retry | Yes | - | No |
| Consistent in isolation | Yes | Sometimes | No |
| Fails in parallel | Yes | - | No |

**Auto-fix Strategy:**

1. Run test in isolation to confirm flakiness
2. Add retries: `test.flaky()` or config retries
3. Add explicit waits for timing issues
4. Isolate test state
5. Do NOT create GitHub issue

**Resolution Template:**

```json
{
  "type": "stabilization",
  "action": "Added retry wrapper; consider running with --workers=1 for this test",
  "autoFixable": true
}
```

## Resolution Types Summary

| Type            | Auto-Fix | GitHub Issue | Test Update    |
| --------------- | -------- | ------------ | -------------- |
| Selector Change | Yes      | No           | Update locator |
| Timing Issue    | Yes      | No           | Add waits      |
| Environment     | Partial  | No           | Re-auth/retry  |
| Data/State      | No       | No           | Seed data      |
| Application Bug | No       | Yes          | Skip/assertion |
| Flaky           | Yes      | No           | Stabilize      |

## Example Classifications

### Example 1: Button Text Changed

```
Error: "getByRole('button', { name: 'Submit' }) did not match any elements"

Classification: Selector Change
Confidence: High (button exists, text changed)
Resolution: Update to 'getByRole('button', { name: 'Send' })'
```

### Example 2: Timeout on API Response

```
Error: "Timeout 30000ms exceeded waiting for element"

Classification: Timing Issue
Confidence: Medium (element exists but slow)
Resolution: Add waitForLoadState or increase timeout
```

### Example 3: Auth Token Expired

```
Error: "Auth token has expired"

Classification: Environment
Confidence: High (clear auth error)
Resolution: Run 'npm run auth' to regenerate
```

### Example 4: Dropdown Options Changed

```
Error: "expected 'Option A' to equal 'Option 1'"

Classification: Application Bug
Confidence: Medium (could be expected or bug)
Resolution: Create GitHub issue, ask user
```

### Example 5: Random Failure

```
Error: "Test failed" but passes on retry

Classification: Flaky
Confidence: High (reproducible with retry)
Resolution: Add stabilization, don't create issue
```
