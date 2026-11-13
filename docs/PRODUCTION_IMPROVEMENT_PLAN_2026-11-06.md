# Google Cloud Professional Agentic Architect: Production Improvement Plan
## Repository: agent-toolchain-core
**Audit Date:** November 6, 2026  
**Target Standard:** Google Cloud Professional Agentic Architect (Domain 2: Using Coding Agents & Customizing Workflows)

---

### Current Assessment
A versioned "Skills-as-Code" developer package featuring reusable slash commands, a codified `AGENTS.md` schema linter (`bin/rules-lint`), and an automated AST PR review bot catching silent exception swallows (`catch {}`) and unchecked `any` casts.

### Critical Gaps
1. **Antigravity Package Standardization:** The repository implements slash commands and linters, but does not yet export standard Antigravity `.gemini/rules/` and `.gemini/skills/` directory bundles.
2. **Agents CLI Integration:** Does not currently wrap the official Google `agents-cli` for package verification, human vs. agent mode testing, and remote registry publishing.
3. **CI/CD Regression Coverage:** Needs a GitHub Actions pipeline testing the AST linter against a suite of 20 intentionally defective code pull requests.

---

### Actionable Implementation Steps

#### 1. Standardize Antigravity Skill Packaging
Export ready-to-use skills matching Antigravity's structure:
```text
.gemini/skills/enterprise-rules-lint/
├── SKILL.md          # Procedural instructions & error explanations
├── scripts/          # AST verification Python script
└── examples/         # Good vs. bad code patterns
```

#### 2. Integrate with `agents-cli`
Add wrapper scripts automating skill lifecycle commands:
```bash
agents-cli skill validate .gemini/skills/enterprise-rules-lint
agents-cli skill package .gemini/skills/enterprise-rules-lint --output-dir ./dist
```

#### 3. Expand AST Detection for LLM-Generated Hallucinations
Add linter rules that specifically target probabilistic code generation failures:
* Detecting non-existent methods called on standard library packages (e.g., `datetime.utcnow()` deprecation).
* Flagging missing timeout parameters on HTTP clients (`httpx.get()`, `requests.post()`).
* Preventing third-party utility imports when native standard library equivalents exist.
