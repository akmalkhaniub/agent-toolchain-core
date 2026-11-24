# AGENTS.md — Autonomous Agent Operating Contract

## 🎯 Repository Purpose & Architecture Philosophy
`agent-toolchain-core` is a versioned 'Skills-as-Code' developer platform featuring reusable Claude Code slash commands, codified `AGENTS.md` schema linters (`bin/rules-lint`), and an automated AST PR review engine catching silent exceptions, unsafe casts, and unindexed foreign keys.

### Tech Stack
- **Language**: TypeScript (Node.js 20+)
- **Testing**: Vitest
- **Core Scripts**: `bin/rules-lint`, `src/review-engine/diff-analyzer.ts`
- **Deterministic Guardrails**: Enforce Zod schema validation and static diff analysis prior to merge.

---

## 🛡️ Forbidden Patterns
- **Silent Exception Swallowing**: Never leave empty `catch (e) {}` blocks without structured logging and rethrow.
- **Unchecked `any` Casts**: Never introduce `: any` in production modules; use `unknown` with Zod narrowing.
- **Unindexed Foreign Keys**: Never add Drizzle `.references(...)` or Prisma `@relation(fields: [...])` foreign keys without an accompanying `index()` or `@@index([...])`.
- **Hardcoded Credentials**: Never commit literal API keys, secrets, or tokens in source files.

---

## ⚡ Autonomous Execution Protocol
1. Pull task from `TASKS.json`.
2. Implement linter rules / AST visitors.
3. Run verification: `npm test`.
4. Commit with: `feat(task-id): description`.

---

## 🧪 Verification Commands
- **Full Test Suite**: `npm test`
- **Type Check**: `npm run lint`
- **Rules Lint**: `npm run lint:rules`
