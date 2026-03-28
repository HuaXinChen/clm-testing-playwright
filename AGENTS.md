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

## General

- Be concise in responses
- Minimize output unless user requests detail
- Ask for clarification when ambiguous
