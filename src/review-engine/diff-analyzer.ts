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

interface FileDiffSection {
  file: string;
  indexedDrizzleCols: Set<string>;
  indexedPrismaFields: Set<string>;
}

export class AiDiffAnalyzer {
  private static collectFileIndexes(lines: string[]): Map<string, FileDiffSection> {
    const sections = new Map<string, FileDiffSection>();
    let currentFile = '';

    for (const line of lines) {
      if (line.startsWith('+++ b/')) {
        currentFile = line.replace('+++ b/', '').trim();
        if (!sections.has(currentFile)) {
          sections.set(currentFile, {
            file: currentFile,
            indexedDrizzleCols: new Set<string>(),
            indexedPrismaFields: new Set<string>(),
          });
        }
        continue;
      }

      if (!currentFile || line.startsWith('---') || line.startsWith('@@') || line.startsWith('-')) {
        continue;
      }

      const code = line.startsWith('+') ? line.substring(1) : line;
      const section = sections.get(currentFile)!;

      // Drizzle: index('idx_name').on(table.userId) or uniqueIndex(...).on(table.orgId, table.userId)
      const drizzleIndexMatches = code.matchAll(/(?:uniqueIndex|index)\s*\([^)]*\)\s*\.on\s*\(([^)]+)\)/g);
      for (const match of drizzleIndexMatches) {
        const args = match[1].split(',');
        for (const arg of args) {
          const propMatch = arg.trim().match(/[a-zA-Z0-9_]+\.([a-zA-Z0-9_]+)/);
          if (propMatch) {
            section.indexedDrizzleCols.add(propMatch[1]);
          }
        }
      }

      // Prisma: @@index([userId, orgId]) or @@unique([userId])
      const prismaIndexMatches = code.matchAll(/@@(?:index|unique)\s*\(\s*\[([^\]]+)\]/g);
      for (const match of prismaIndexMatches) {
        const fields = match[1].split(',');
        for (const f of fields) {
          const cleaned = f.trim().split(/[\s(]/)[0];
          if (cleaned) {
            section.indexedPrismaFields.add(cleaned);
          }
        }
      }
    }

    return sections;
  }

  public static analyzeDiff(diffText: string): DiffAnalysisResult {
    const findings: ReviewFinding[] = [];
    const filesAnalyzed: string[] = [];

    const lines = diffText.split('\n');
    const fileIndexes = this.collectFileIndexes(lines);
    let currentFile = '';
    let currentLineNumber = 0;
    let recentAddedContext: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('+++ b/')) {
        currentFile = line.replace('+++ b/', '').trim();
        if (!filesAnalyzed.includes(currentFile)) {
          filesAnalyzed.push(currentFile);
        }
        currentLineNumber = 0;
        recentAddedContext = [];
        continue;
      }

      if (line.startsWith('@@')) {
        const match = line.match(/\+(\d+)/);
        if (match) {
          currentLineNumber = parseInt(match[1], 10) - 1;
        }
        recentAddedContext = [];
        continue;
      }

      if (line.startsWith('+') && !line.startsWith('+++')) {
        currentLineNumber++;
        const addedCode = line.substring(1).trim();
        recentAddedContext.push(addedCode);
        if (recentAddedContext.length > 4) {
          recentAddedContext.shift();
        }

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

        // 5. Unindexed Foreign Key Detector (Drizzle ORM & Prisma schemas)
        const section = fileIndexes.get(currentFile);
        if (/\.references\s*\(/.test(addedCode)) {
          let colName: string | undefined;
          let columnScopedSnippet = addedCode;
          const directColMatch = addedCode.match(/^([a-zA-Z0-9_]+)\s*:/);
          if (directColMatch) {
            colName = directColMatch[1];
          } else {
            for (let j = recentAddedContext.length - 1; j >= 0; j--) {
              const prev = recentAddedContext[j];
              const m = prev.match(/^([a-zA-Z0-9_]+)\s*:/);
              if (m) {
                colName = m[1];
                columnScopedSnippet = recentAddedContext.slice(j).join(' ');
                break;
              }
            }
          }
          const hasInlineUnique =
            /\.unique\s*\(/.test(columnScopedSnippet) || /\.primaryKey\s*\(/.test(columnScopedSnippet);

          if (colName && !hasInlineUnique && !section?.indexedDrizzleCols.has(colName)) {
            findings.push({
              ruleId: 'MISSING_FOREIGN_KEY_INDEX',
              file: currentFile,
              line: currentLineNumber,
              severity: 'WARNING',
              title: `Unindexed Drizzle Foreign Key (\`${colName}\`)`,
              description: `Foreign key column \`${colName}\` uses .references() without an explicit index(), risking sequential scans on joins and ON DELETE cascades.`,
              codeSnippet: addedCode,
              suggestedFix: `(table) => ({ ${colName}Idx: index('idx_${colName}').on(table.${colName}) })`
            });
          }
        }

        const prismaRelMatch = addedCode.match(/@relation\s*\([^)]*fields\s*:\s*\[([^\]]+)\]/);
        if (prismaRelMatch) {
          const fkFields = prismaRelMatch[1]
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          const missingFields = fkFields.filter(f => !section?.indexedPrismaFields.has(f));
          if (missingFields.length > 0) {
            findings.push({
              ruleId: 'MISSING_FOREIGN_KEY_INDEX',
              file: currentFile,
              line: currentLineNumber,
              severity: 'WARNING',
              title: `Unindexed Prisma Foreign Key (${missingFields.join(', ')})`,
              description: `Prisma @relation foreign key field(s) [${missingFields.join(', ')}] lack a matching @@index([${missingFields.join(', ')}]) in the model block.`,
              codeSnippet: addedCode,
              suggestedFix: `@@index([${missingFields.join(', ')}])`
            });
          }
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
