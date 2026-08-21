# ⚡ Agent Toolchain Core

> **Versioned Skills-as-Code, Agent Rules Standard Linter, Pre-Commit Runtime Hooks, & AI Code Review Engine.**

![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Claude Code](https://img.shields.io/badge/Claude_Code-Skills_as_Code-d97757)
![Vitest](https://img.shields.io/badge/Vitest-Passing-729b1b)
![License](https://img.shields.io/badge/License-MIT-green)

---

## 🌟 Overview

**Agent Toolchain Core** provides an enterprise developer toolchain for engineering organizations adopting an AI-First operating model. It turns prompt guidelines, slash commands, agent boundaries, and code review policies into versioned, executable, testable code.

---

## 🛠️ Core Capabilities

### 1. Versioned Skills-as-Code (`.claude/skills/`)
- `/eval-pr`: Structured PR code review covering security, silent-failure defense, and typing.
- `/gen-adr`: Architectural Decision Record generator with trade-off matrices and cost models.
- `/defensive-audit`: Deep scan for silent error swallowing, missing timeouts, and unmonitored AI fallbacks.

### 2. Rules Standard & CLI Linter (`bin/rules-lint`)
- Validates repository `AGENTS.md` and `RULES.md` files against the corporate schema to ensure every repository has unambiguous boundaries and verification commands.
```bash
npx rules-lint AGENTS.md
```

### 3. Automated AI Code Review Engine (`bin/ai-review`)
- Simulates CodeRabbit / Cursor BugBot AST diff analysis.
- Catches:
  - 🔴 **BLOCKING**: Silent exception swallows (`catch {}`), hardcoded secrets.
  - 🟡 **WARNING**: Unchecked `any` casts in TypeScript.
  - 🔵 **SUGGESTION**: Unstructured `console.log` in production code.
- Generates formatted GitHub PR review markdown comments.

---

## 🚀 Quickstart & Testing

```bash
# Install dependencies
npm install

# Run test suite
npm test

# Lint AGENTS.md standard
npm run lint:rules

# Run AI review on a diff
git diff HEAD~1 | npx ai-review
```
