import { DiffAnalysisResult } from './diff-analyzer.js';

export class PrMarkdownReporter {
  public static formatMarkdown(result: DiffAnalysisResult): string {
    const icon = result.verdict === 'APPROVE' ? '✅' : result.verdict === 'REQUEST_CHANGES' ? '❌' : '⚠️';
    const lines: string[] = [];

    lines.push(`## ${icon} AI Code Review Report — Verdict: **${result.verdict}**\n`);
    lines.push(`| Status | Blocking Issues | Warnings | Suggestions | Files Analyzed |`);
    lines.push(`|---|---|---|---|---|`);
    lines.push(`| **${result.verdict}** | ${result.blockingCount} | ${result.warningCount} | ${result.suggestionCount} | ${result.filesAnalyzed.length} |\n`);

    if (result.findings.length === 0) {
      lines.push(`> ✨ **All defensive coding & architecture rules passed! No issues detected.**`);
      return lines.join('\n');
    }

    lines.push(`### 🔍 Review Findings & Remediations\n`);

    for (const finding of result.findings) {
      const badge = finding.severity === 'BLOCKING' ? '🔴 **BLOCKING**' : finding.severity === 'WARNING' ? '🟡 **WARNING**' : '🔵 **SUGGESTION**';
      lines.push(`#### ${badge}: ${finding.title}`);
      lines.push(`- **Location**: \`${finding.file}:${finding.line}\``);
      lines.push(`- **Rule**: \`${finding.ruleId}\``);
      lines.push(`- **Issue**: ${finding.description}`);
      lines.push(`\`\`\`typescript\n// Found:\n${finding.codeSnippet}\n\`\`\``);
      if (finding.suggestedFix) {
        lines.push(`- **Suggested Fix**: ${finding.suggestedFix}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
