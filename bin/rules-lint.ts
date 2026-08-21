#!/usr/bin/env node
import { Command } from 'commander';
import pc from 'picocolors';
import { AgentRulesValidator } from '../src/rules-spec/validator.js';

const program = new Command();

program
  .name('rules-lint')
  .description('Lint and validate AGENTS.md or RULES.md files against enterprise standard')
  .argument('[filePath]', 'Path to the rules markdown file', 'AGENTS.md')
  .action((filePath: string) => {
    console.log(pc.cyan(`\n🔍 Validating agent rules file: ${filePath}...\n`));

    const result = AgentRulesValidator.validateFile(filePath);

    if (result.valid) {
      console.log(pc.green(`✅ SUCCESS: '${filePath}' complies with corporate Agent Rules Standard.`));
      if (result.spec) {
        console.log(pc.dim(`   Title: ${result.spec.title}`));
        console.log(pc.dim(`   Philosophy points: ${result.spec.architecturePhilosophy.length}`));
        console.log(pc.dim(`   Forbidden rules: ${result.spec.forbiddenPatterns.length}`));
        console.log(pc.dim(`   Verification commands: ${result.spec.verificationCommands.length}`));
      }
      process.exit(0);
    } else {
      console.error(pc.red(`❌ FAILED: '${filePath}' contains compliance errors:`));
      result.errors.forEach(err => console.error(pc.red(`   - ${err}`)));
      process.exit(1);
    }
  });

program.parse(process.argv);
