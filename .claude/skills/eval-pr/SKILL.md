---
name: eval-pr
description: Thoroughly evaluates a pull request diff against security, performance, test coverage, and defensive coding rules.
---

# /eval-pr — AI Code Review & PR Evaluation Skill

Use this skill to perform automated pre-merge evaluation on pull requests or git diffs.

## Review Dimensions

1. **Security & Boundary Validation**:
   - Verify that all untrusted input parameters are parsed with Zod schemas.
   - Ensure secrets, API keys, or tokens are never committed or logged.
   - Detect unsafe database access or SQL injection surfaces.

2. **Error Handling & Resilience (Silent Failure Prevention)**:
   - Disallow empty `catch (e) {}` blocks.
   - Ensure all third-party API calls have explicit timeouts and retry-backoff policies.
   - Check that promises are properly awaited or handled.

3. **Code Quality & Typing**:
   - Disallow naked `any` casts without explicit justification.
   - Verify that exported symbols include explicit TypeScript return types.
   - Check that removed code doesn't leave orphaned exports or circular dependencies.

4. **Testing & Verification**:
   - Ensure new functionality is accompanied by corresponding unit/integration test suites.
   - Verify that test assertions test both happy paths and edge-case failure modes.

## Output Format
Always report findings in structured markdown:
- **Summary**: Overall verdict (APPROVE / REQUEST_CHANGES / COMMENT).
- **Critical Issues**: Blocking defects that must be fixed before merge.
- **Suggestions & Warnings**: Non-blocking improvements for maintainability.
- **Verification Commands**: Exact CLI command to reproduce test runs.
