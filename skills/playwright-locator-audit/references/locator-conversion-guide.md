# Locator Conversion Guide

## Conversion Patterns

### CSS ID Selectors

| From                                      | To                                                  | Notes                         |
| ----------------------------------------- | --------------------------------------------------- | ----------------------------- |
| `locator("#onetrust-accept-btn-handler")` | `getByRole("button", { name: /accept\|cookies/i })` | Cookie consent buttons        |
| `locator("#dialogPrimaryButton")`         | `getByRole("button", { name: /sign\|accept/i })`    | Dialog confirmation buttons   |
| `locator("#kolas-editor-iframe")`         | `frameLocator("#kolas-editor-iframe")`              | Iframes - keep CSS ID         |
| `locator("#element-id")`                  | `getByRole(...)` or `getByText(...)`                | Analyze DOM for semantic role |

### XPath Selectors

| From                                     | To                                         | Notes                 |
| ---------------------------------------- | ------------------------------------------ | --------------------- |
| `locator('//span[contains(., "text")]')` | `getByText("text", { exact: false })`      | Text content matching |
| `locator("//div[@class='x']")`           | `getByRole("...")`                         | Analyze element role  |
| `locator("//*[contains(@id, 'x')]")`     | `getByTestId(...)` or semantic alternative | Fragile, avoid        |

### CSS Attribute Selectors

| From                                  | To                                                  | Notes                       |
| ------------------------------------- | --------------------------------------------------- | --------------------------- |
| `locator('input[type="email"]')`      | `getByRole("textbox", { name: /email/i })`          | If label exists             |
| `locator('input[name="email"]')`      | `getByRole("textbox")` or `getByLabel(...)`         | Depends on DOM              |
| `locator('input[name^="search"]')`    | `getByPlaceholder(...)` or `getByRole("searchbox")` | Search inputs               |
| `locator('input[placeholder="..."]')` | `getByPlaceholder("...")`                           | Prefer explicit placeholder |

### Generic Element Selectors

| From                        | To                                                     | Notes                      |
| --------------------------- | ------------------------------------------------------ | -------------------------- |
| `locator("input")`          | `getByRole("textbox")` or `getByLabel(...)`            | Context-dependent          |
| `locator("body")`           | `page.getByRole("main")` or `page.getByRole("banner")` | Use semantic landmarks     |
| `locator("a, button")`      | `.getByRole("link").or(.getByRole("button"))`          | Use .or() for alternatives |
| `locator("table tbody tr")` | `getByRole("row")`                                     | Table rows                 |
| `locator("iframe")`         | `frameLocator("iframe")` or `getByRole("frame")`       | Frames need frameLocator   |

### CSS Class Selectors

| From                      | To                                     | Notes                              |
| ------------------------- | -------------------------------------- | ---------------------------------- |
| `locator(".class-name")`  | Analyze DOM for semantic role          | Classes are implementation details |
| `locator(".btn-primary")` | `getByRole("button", { name: /.../ })` | Buttons have semantic roles        |

## Semantic Locator Priority

### For Buttons

1. `getByRole("button", { name: /submit/i })`
2. `getByRole("button", { name: /save/i })`
3. `getByRole("button", { name: /cancel/i })`
4. `getByText("Submit")` as fallback

### For Links

1. `getByRole("link", { name: /.../ })`
2. `getByText("...")` if clearly a link

### For Form Inputs

1. `getByLabel("Email")` - Best for inputs with labels
2. `getByPlaceholder("Enter email")` - For inputs with placeholders
3. `getByRole("textbox", { name: /email/i })` - Regex matching
4. `getByTestId("email-input")` - Last resort

### For Text Content

1. `getByText("Exact text")`
2. `getByText("Partial text", { exact: false })`
3. `getByRole("heading", { name: /.../ })` - For headings

## DOM Analysis Checklist

When converting a locator:

1. **Identify the element type** - What is the semantic role?
2. **Check for accessible name** - Is there text, label, or placeholder?
3. **Look for unique attributes** - data-testid, aria-label, id
4. **Consider context** - Is this in a dialog, form, navigation?
5. **Test the new locator** - Verify it matches exactly one element

## Common Patterns

### Cookie Banners

```typescript
// Before
page.locator("#onetrust-accept-btn-handler").click();

// After
page.getByRole("button", { name: /accept|agree|cookies/i }).click();
```

### Dialog Buttons

```typescript
// Before
page.locator("#dialogPrimaryButton").click();

// After
page.getByRole("button", { name: /confirm|accept|sign|yes/i }).click();
```

### Radio/Checkbox Options

```typescript
// Before
frame.locator('//span[contains(., "Do not replace")]').click();

// After
frame.getByRole("radio", { name: /do not replace/i }).click();
// or
frame.getByText("Do not replace", { exact: false }).click();
```

### Table Rows

```typescript
// Before
page.locator("table tbody tr").first().click();

// After
page.getByRole("row").first().click();
```

### Links in Tables

```typescript
// Before
row.locator("a").first().click();
row.locator("a[href]").first().click();

// After
row.getByRole("link").first().click();
```

## When to Keep CSS Selectors

Some CSS selectors are acceptable:

1. **Iframe identification** - `frameLocator("#iframe-id")` is standard
2. **Waiting for page load** - `locator("body").waitFor()` in iframes
3. **Complex grid patterns** - When no semantic alternative exists
4. **External applications** - Mailinator, third-party UIs

## Testing Conversions

Always verify converted locators:

1. Run the test - should pass
2. Check no duplicate matches - `count()` should be 1
3. Verify timeout behavior - should be fast
4. Test in isolation - run just that test

## Reference: Playwright Locator Best Practices

From official Playwright documentation:

> **Prefer user-facing attributes** - prefer `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText` over `locator` with CSS or XPath selectors.

> **Prefer locators to roles** - `getByRole` has several advantages over CSS/XPath: it is semantic, it will guide you towards better accessibility, and it is robust against DOM changes.

> **Prefer descriptive locators** - Choose locators that describe the user's intent, not the implementation.
