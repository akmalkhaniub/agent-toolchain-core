import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { AgentRulesValidator } from '../src/rules-spec/validator.js';

describe('Agent Rules Validator (RULES.md / AGENTS.md)', () => {
  const rootAgentsPath = path.resolve(__dirname, '../AGENTS.md');

  it('should validate repository AGENTS.md successfully', () => {
    const result = AgentRulesValidator.validateFile(rootAgentsPath);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.spec?.architecturePhilosophy.length).toBeGreaterThan(0);
    expect(result.spec?.forbiddenPatterns.length).toBeGreaterThan(0);
    expect(result.spec?.verificationCommands.length).toBeGreaterThan(0);
  });

  it('should reject malformed rules missing required sections', () => {
    const invalidMarkdown = `
# Incomplete Rules
Some random content without proper sections.
    `;

    const result = AgentRulesValidator.validateContent(invalidMarkdown);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some(e => e.includes('Architecture Philosophy'))).toBe(true);
  });
});
