# AGENTS.md — Corporate Agentic Rules Standard

This document defines the strict engineering guidelines and boundaries for autonomous AI coding agents operating on this repository.

## Architecture Philosophy
- Treat prompt engineering and agent rules as versioned code with automated regression tests.
- Favor explicit schemas (Zod) and typed contracts over untyped data manipulation.
- Design every AI feature with silent-failure defense, structured output verification, and cost tracking.

## Allowed Actions
- Adding new Claude Code skills under `.claude/skills/`.
- Adding new lint rules to `src/review-engine/` and `src/rules-spec/`.
- Running test suites via `npm test` and typechecking via `npm run lint`.

## Forbidden Patterns
- Disallow empty `catch` blocks or swallowing errors silently.
- Disallow `any` casts in non-test TypeScript source files without explicit team approval.
- Disallow committing hardcoded API keys, bearer tokens, or secrets.
- Disallow naked `console.log` in production runtime modules.

## Verification Commands
- `npm test`: Runs Vitest test suite for linter and review engine.
- `npm run lint`: Verifies strict TypeScript type compliance.
- `npm run lint:rules`: Validates AGENTS.md against the rules schema.
