export type ReviewSeverity = 'BLOCKING' | 'WARNING' | 'SUGGESTION';

export interface ReviewFinding {
  ruleId: string;
  file: string;
  line: number;
  severity: ReviewSeverity;
  title: string;
  description: string;
  codeSnippet: string;
  suggestedFix?: string;
}

export interface DiffAnalysisResult {
  verdict: 'APPROVE' | 'REQUEST_CHANGES' | 'COMMENT';
  blockingCount: number;
  warningCount: number;
  suggestionCount: number;
  findings: ReviewFinding[];
  filesAnalyzed: string[];
}

export class AiDiffAnalyzer {
  public static analyzeDiff(diffText: string): DiffAnalysisResult {
    const findings: ReviewFinding[] = [];
    const filesAnalyzed: string[] = [];

    const lines = diffText.split('\n');
    let currentFile = '';
    let currentLineNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('+++ b/')) {
        currentFile = line.replace('+++ b/', '').trim();
        if (!filesAnalyzed.includes(currentFile)) {
          filesAnalyzed.push(currentFile);
        }
        currentLineNumber = 0;
        continue;
      }

      if (line.startsWith('@@')) {
        const match = line.match(/\+(\d+)/);
        if (match) {
          currentLineNumber = parseInt(match[1], 10) - 1;
        }
        continue;
      }

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentLineNumber++;
        const addedCode = line.substring(1).trim();

        // 1. Silent failure detector: catch (e) {} or catch {} with empty body
        if (/catch\s*(\([a-zA-Z0-9_]*\))?\s*\{\s*\}/.test(addedCode)) {
          findings.push({
            ruleId: 'NO_SILENT_EXCEPTION_SWALLOW',
            file: currentFile,
            line: currentLineNumber,
            severity: 'BLOCKING',
            title: 'Silent Exception Swallowed',
            description: 'Empty catch block suppresses errors, causing silent failures in production.',
            codeSnippet: addedCode,
            suggestedFix: 'catch (err) { logger.error("Operation failed", { err }); throw err; }'
          });
        }

        // 2. Unchecked any type in TypeScript
        if (/:\s*any\b/.test(addedCode) && !currentFile.includes('test') && !addedCode.includes('eslint-disable')) {
          findings.push({
            ruleId: 'NO_UNCHECKED_ANY',
            file: currentFile,
            line: currentLineNumber,
            severity: 'WARNING',
            title: 'Unchecked `any` Type Cast',
            description: 'Using `any` disables TypeScript type safety. Use `unknown` with a type guard or define a Zod schema.',
            codeSnippet: addedCode,
            suggestedFix: 'Replace `any` with a concrete interface or `unknown` + narrowing.'
          });
        }

        // 3. Raw console.log in non-test production code
        if (/\bconsole\.log\(/.test(addedCode) && !currentFile.includes('test') && !currentFile.includes('scripts')) {
          findings.push({
            ruleId: 'NO_RAW_CONSOLE_LOG',
            file: currentFile,
            line: currentLineNumber,
            severity: 'SUGGESTION',
            title: 'Raw console.log in Production Code',
            description: 'Prefer structured logging (e.g. Pino / Winston) over unstructured console.log.',
            codeSnippet: addedCode,
            suggestedFix: 'logger.info(...) with structured JSON context.'
          });
        }

        // 4. Hardcoded API secrets or private keys
        if (/(api[_-]?key|secret|password|token)\s*[:=]\s*['"`][a-zA-Z0-9_\-]{16,}['"`]/i.test(addedCode)) {
          findings.push({
            ruleId: 'NO_HARDCODED_SECRETS',
            file: currentFile,
            line: currentLineNumber,
            severity: 'BLOCKING',
            title: 'Hardcoded Secret or Token Detected',
            description: 'Potential secret or credential hardcoded in source code.',
            codeSnippet: addedCode.replace(/(['"`])[^'"`]+(['"`])/, '$1***REDACTED***$2'),
            suggestedFix: 'Load credentials dynamically from process.env with runtime validation.'
          });
        }
      } else if (!line.startsWith('-')) {
        currentLineNumber++;
      }
    }

    const blockingCount = findings.filter(f => f.severity === 'BLOCKING').length;
    const warningCount = findings.filter(f => f.severity === 'WARNING').length;
    const suggestionCount = findings.filter(f => f.severity === 'SUGGESTION').length;

    const verdict = blockingCount > 0 ? 'REQUEST_CHANGES' : warningCount > 0 ? 'COMMENT' : 'APPROVE';

    return {
      verdict,
      blockingCount,
      warningCount,
      suggestionCount,
      findings,
      filesAnalyzed
    };
  }
}
