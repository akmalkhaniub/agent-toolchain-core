import * as fs from 'fs';
import { AgentRulesSchema, AgentRulesSpec } from './schema.js';

export interface RulesValidationResult {
  valid: boolean;
  filePath: string;
  spec?: AgentRulesSpec;
  errors: string[];
  warnings: string[];
}

export class AgentRulesValidator {
  /**
   * Validate a RULES.md or AGENTS.md file against the corporate standard
   */
  public static validateFile(filePath: string): RulesValidationResult {
    if (!fs.existsSync(filePath)) {
      return {
        valid: false,
        filePath,
        errors: [`File does not exist at path: ${filePath}`],
        warnings: []
      };
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    return this.validateContent(content, filePath);
  }

  public static validateContent(content: string, filePath: string = 'AGENTS.md'): RulesValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const lines = content.split('\n');
    let title = '';
    const sections: Record<string, string[]> = {};
    let currentSection = '';

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (line.startsWith('# ') && !title) {
        title = line.replace(/^#\s+/, '').trim();
      } else if (line.startsWith('## ')) {
        currentSection = line.replace(/^##\s+/, '').trim().toLowerCase();
        sections[currentSection] = [];
      } else if (currentSection && (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s+/.test(line))) {
        const item = line.replace(/^[-*]\s+|\d+\.\s+/, '').trim();
        sections[currentSection].push(item);
      }
    }

    if (!title) {
      errors.push('Missing top-level H1 title (e.g. # AGENTS.md — Repository Operating Rules)');
    }

    // Map discovered sections
    const getItems = (keywords: string[]): string[] => {
      for (const [key, items] of Object.entries(sections)) {
        if (keywords.some(kw => key.includes(kw))) {
          return items;
        }
      }
      return [];
    };

    const philosophy = getItems(['architecture', 'philosophy', 'principles', 'guidelines']);
    const forbidden = getItems(['forbidden', 'disallow', 'anti-pattern', 'restrictions']);
    const commands = getItems(['verification', 'command', 'testing', 'run', 'script']);
    const allowed = getItems(['allowed', 'permitted', 'workflow']);

    if (philosophy.length === 0) {
      errors.push('Missing required section: Architecture Philosophy or Guidelines (## Architecture Philosophy)');
    }

    if (forbidden.length === 0) {
      errors.push('Missing required section: Forbidden Patterns (## Forbidden Patterns)');
    }

    if (commands.length === 0) {
      errors.push('Missing required section: Verification Commands (## Verification Commands)');
    }

    const parsed = AgentRulesSchema.safeParse({
      title: title || 'Untitled Rules',
      architecturePhilosophy: philosophy,
      allowedActions: allowed,
      forbiddenPatterns: forbidden,
      verificationCommands: commands,
      testingStandards: commands
    });

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors.push(`${issue.path.join('.')}: ${issue.message}`);
      }
    }

    return {
      valid: errors.length === 0,
      filePath,
      spec: parsed.success ? parsed.data : undefined,
      errors,
      warnings
    };
  }
}
