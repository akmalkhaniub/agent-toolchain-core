# AGENTS.md — Autonomous Agent Operating Contract

## 🎯 Repository Purpose & Architecture
`agent-toolchain-core` is a versioned 'Skills-as-Code' developer platform featuring reusable Claude Code slash commands, codified `AGENTS.md` schema linters (`bin/rules-lint`), and an automated AST PR review engine catching silent exceptions and unsafe casts.

### Tech Stack
- **Language**: TypeScript (Node.js 20+)
- **Testing**: Vitest
- **Core Scripts**: `bin/rules-lint`, `src/review-engine.ts`

---

## ⚡ Autonomous Execution Protocol
1. Pull task from `TASKS.json`.
2. Implement linter rules / AST visitors.
3. Run verification: `pnpm test`.
4. Commit with: `feat(task-id): description`.
