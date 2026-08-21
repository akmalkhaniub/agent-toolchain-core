---
name: defensive-audit
description: Scans repositories for silent failures, uncaught rejections, missing API timeouts, and unmonitored AI fallbacks.
---

# /defensive-audit — Defensive AI & Reliability Audit Skill

Use this skill to scan services for high-risk runtime failure patterns before deploying to production.

## Audit Checklist

1. **AI API Invocation Safeguards**:
   - Every LLM / multimodal provider call must have:
     - Explicit request timeout (`timeoutMs: 30000`)
     - Exponential backoff retry handler (e.g. status 429 / 503)
     - Fallback model or graceful degradation strategy
     - Structured token-usage logging and cost tracking

2. **Silent Failure & Exception Masking**:
   - Detect `catch (e) {}` with no logging or rethrowing.
   - Detect `Promise.all` without rejection isolation where a single failure aborts independent batches.
   - Detect missing HTTP status checking on `fetch()` calls (`if (!res.ok)`).

3. **Database & Connection Leaks**:
   - Verify all database clients use connection pooling with explicit acquire/idle timeouts.
   - Check that transaction handles are rolled back in `finally` blocks.

## Remediation Output
Output remediation diffs using GitHub diff syntax with clear rationales.
