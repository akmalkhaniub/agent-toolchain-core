---
name: gen-adr
description: Generates an Architectural Decision Record (ADR) following enterprise standards with context, alternatives considered, and trade-off matrices.
---

# /gen-adr — Architectural Decision Record Generator

Use this skill when proposing significant architectural changes, introducing new dependencies, or deprecating existing systems.

## Required Sections in Generated ADR

1. **Title & Status**: ADR-XXX: Title (Proposed / Accepted / Superseded).
2. **Context & Problem Statement**: What problem are we solving? What are the business and engineering constraints?
3. **Decision Drivers**: Key priorities (e.g., latency, developer velocity, cost model, backwards compatibility).
4. **Considered Options**:
   - Option 1 (Chosen)
   - Option 2 (Alternative)
   - Option 3 (Alternative)
5. **Trade-Off Matrix**:
   | Criteria | Option 1 (Chosen) | Option 2 | Option 3 |
   |---|---|---|---|
   | DX / Complexity | High / Low | Moderate | High |
   | Running Cost | $X / mo | $Y / mo | $Z / mo |
   | Maintenance Burden | Low | High | Moderate |
6. **Decision Outcome & Consequences**:
   - Positive consequences
   - Negative consequences & mitigation strategies
7. **Implementation Plan & Rollout Milestones**: Concrete phases for delivery.
