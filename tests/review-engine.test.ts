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

  it('should flag unindexed Drizzle foreign keys with exact line numbers', () => {
    const drizzleDiff = `
--- a/src/db/schema.ts
+++ b/src/db/schema.ts
@@ -10,3 +10,5 @@
+export const invoices = pgTable('invoices', {
+  id: serial('id').primaryKey(),
+  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
+});
`;

    const result = AiDiffAnalyzer.analyzeDiff(drizzleDiff);
    expect(result.verdict).toBe('COMMENT');
    expect(result.warningCount).toBe(1);
    expect(result.findings[0].ruleId).toBe('MISSING_FOREIGN_KEY_INDEX');
    expect(result.findings[0].line).toBe(12);
    expect(result.findings[0].suggestedFix).toContain('table.tenantId');
  });

  it('should allow Drizzle foreign keys covered by explicit index()', () => {
    const indexedDrizzleDiff = `
--- a/src/db/schema.ts
+++ b/src/db/schema.ts
@@ -10,3 +10,7 @@
+export const invoices = pgTable('invoices', {
+  id: serial('id').primaryKey(),
+  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
+}, (table) => ({
+  tenantIdx: index('idx_invoices_tenant_id').on(table.tenantId),
+}));
`;

    const result = AiDiffAnalyzer.analyzeDiff(indexedDrizzleDiff);
    expect(result.verdict).toBe('APPROVE');
    expect(result.findings).toHaveLength(0);
  });

  it('should flag unindexed Prisma @relation foreign keys and accept @@index', () => {
    const unindexedPrismaDiff = `
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -15,3 +15,5 @@
+model LeaseDocument {
+  id         String @id
+  propertyId String
+  property   Property @relation(fields: [propertyId], references: [id])
+}
`;
    const badResult = AiDiffAnalyzer.analyzeDiff(unindexedPrismaDiff);
    expect(badResult.verdict).toBe('COMMENT');
    expect(badResult.findings[0].ruleId).toBe('MISSING_FOREIGN_KEY_INDEX');
    expect(badResult.findings[0].line).toBe(18);
    expect(badResult.findings[0].suggestedFix).toBe('@@index([propertyId])');

    const indexedPrismaDiff = `
--- a/prisma/schema.prisma
+++ b/prisma/schema.prisma
@@ -15,3 +15,6 @@
+model LeaseDocument {
+  id         String @id
+  propertyId String
+  property   Property @relation(fields: [propertyId], references: [id])
+  @@index([propertyId])
+}
`;
    const goodResult = AiDiffAnalyzer.analyzeDiff(indexedPrismaDiff);
    expect(goodResult.verdict).toBe('APPROVE');
    expect(goodResult.findings).toHaveLength(0);
  });
});
