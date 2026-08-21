#!/usr/bin/env node
import { Command } from 'commander';
import * as fs from 'fs';
import { AiDiffAnalyzer } from '../src/review-engine/diff-analyzer.js';
import { PrMarkdownReporter } from '../src/review-engine/pr-reporter.js';

const program = new Command();

program
  .name('ai-review')
  .description('Perform automated AST and defensive code review on a git diff')
  .option('-f, --file <diffFile>', 'Path to diff file')
  .option('-o, --output <outFile>', 'Path to write markdown output comment')
  .action((options) => {
    let diffContent = '';

    if (options.file) {
      if (!fs.existsSync(options.file)) {
        console.error(`Diff file not found: ${options.file}`);
        process.exit(1);
      }
      diffContent = fs.readFileSync(options.file, 'utf-8');
    } else {
      diffContent = fs.readFileSync(0, 'utf-8'); // read from stdin
    }

    const result = AiDiffAnalyzer.analyzeDiff(diffContent);
    const markdown = PrMarkdownReporter.formatMarkdown(result);

    if (options.output) {
      fs.writeFileSync(options.output, markdown, 'utf-8');
      console.log(`Review written to ${options.output}`);
    } else {
      console.log(markdown);
    }

    if (result.verdict === 'REQUEST_CHANGES') {
      process.exit(1);
    } else {
      process.exit(0);
    }
  });

program.parse(process.argv);
