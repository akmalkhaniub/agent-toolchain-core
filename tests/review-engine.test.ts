import { describe, it, expect } from 'vitest';
import { AiDiffAnalyzer } from '../src/review-engine/diff-analyzer.js';
import { PrMarkdownReporter } from '../src/review-engine/pr-reporter.js';

describe('AI Code Review & Diff Engine', () => {
  it('should detect silent error swallowing and block merge', () => {
    const diffWithSilentFailure = `
--- a/src/api.ts
+++ b/src/api.ts
@@ -10,4 +10,6 @@
+try {
+  await callPaymentGateway();
+} catch (e) {}
`;

    const result = AiDiffAnalyzer.analyzeDiff(diffWithSilentFailure);
    expect(result.verdict).toBe('REQUEST_CHANGES');
    expect(result.blockingCount).toBe(1);
    expect(result.findings[0].ruleId).toBe('NO_SILENT_EXCEPTION_SWALLOW');

    const markdown = PrMarkdownReporter.formatMarkdown(result);
    expect(markdown).toContain('AI Code Review Report — Verdict: **REQUEST_CHANGES**');
    expect(markdown).toContain('Silent Exception Swallowed');
  });

  it('should flag unchecked any casts as warnings', () => {
    const diffWithAny = `
--- a/src/service.ts
+++ b/src/service.ts
@@ -5,3 +5,4 @@
+const payload: any = JSON.parse(raw);
`;

    const result = AiDiffAnalyzer.analyzeDiff(diffWithAny);
    expect(result.verdict).toBe('COMMENT');
    expect(result.warningCount).toBe(1);
    expect(result.findings[0].ruleId).toBe('NO_UNCHECKED_ANY');
  });

  it('should approve clean defensive diffs', () => {
    const cleanDiff = `
--- a/src/service.ts
+++ b/src/service.ts
@@ -5,3 +5,6 @@
+try {
+  const payload: UserRecord = UserSchema.parse(JSON.parse(raw));
+  return payload;
+} catch (error) {
+  logger.error("Failed to parse user payload", { error });
+  throw error;
+}
`;

    const result = AiDiffAnalyzer.analyzeDiff(cleanDiff);
    expect(result.verdict).toBe('APPROVE');
    expect(result.blockingCount).toBe(0);
  });
});
