import { writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import {
  ConfigError,
  buildPullRequestReport,
  countResultsByStatus,
  loadVisualConfig,
  runVisualCheck,
} from '@spot-the-diff/core';
import { approveScreenshots } from './commands/approve-screenshots.ts';
import { CliUsageError } from './cli-usage-error.ts';
import { EXIT_CODE, formatTerminalSummary, getCheckExitCode } from './output/check-outcome.ts';
import { HELP_TEXT, parseCliArgs, type CliCommand } from './args/parse-cli-args.ts';

/** Where the CLI writes. Injected so tests can capture output instead of printing it. */
export interface CliOutput {
  info(line: string): void;
  error(line: string): void;
}

type CheckCommand = Extract<CliCommand, { name: 'check' }>;
type ApproveCommand = Extract<CliCommand, { name: 'approve' }>;

/**
 * Runs one CLI invocation and returns the process exit code.
 * Mistakes the user can fix (bad arguments, bad config) become a message
 * and exit code 2; anything else is a bug and is rethrown with its stack.
 */
export async function runCli(argv: string[], output: CliOutput): Promise<number> {
  try {
    const command = parseCliArgs(argv);
    if (command.name === 'check') return await check(command, output);
    if (command.name === 'approve') return await approve(command, output);
    output.info(HELP_TEXT);
    return EXIT_CODE.ok;
  } catch (error) {
    if (error instanceof CliUsageError || error instanceof ConfigError) {
      output.error(error.message);
      return EXIT_CODE.usageError;
    }
    throw error;
  }
}

async function check(command: CheckCommand, output: CliOutput): Promise<number> {
  const config = await loadVisualConfig(command.configPath);
  const results = await runVisualCheck({ config, baselineDir: command.baselineDir, outputDir: command.outputDir });
  const counts = countResultsByStatus(results);

  const reportPath = join(command.outputDir, 'report.md');
  const report = buildPullRequestReport(results, { imageUrl: (filePath) => toReportLink(command.outputDir, filePath) });
  await writeFile(reportPath, report);

  formatTerminalSummary(results, counts).forEach((line) => output.info(line));
  output.info(`Report: ${reportPath}`);
  return getCheckExitCode(counts, command.failOnDiff);
}

async function approve(command: ApproveCommand, output: CliOutput): Promise<number> {
  const approved = await approveScreenshots(command.outputDir, command.baselineDir);
  output.info(`Approved ${approved.length} screenshots into ${command.baselineDir}`);
  return EXIT_CODE.ok;
}

/**
 * Links in the local report are relative to the report itself, so it can be
 * opened in any markdown preview. Markdown needs forward slashes even on Windows.
 */
function toReportLink(reportDir: string, filePath: string): string {
  return relative(reportDir, filePath).split(sep).join('/');
}