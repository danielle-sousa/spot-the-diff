import { parseArgs } from 'node:util';
import { CliUsageError } from '../cli-usage-error.ts';

export type CliCommand =
  | { name: 'check'; configPath: string; baselineDir: string; outputDir: string; failOnDiff: boolean }
  | { name: 'approve'; baselineDir: string; outputDir: string }
  | { name: 'help' };

export const HELP_TEXT = `Usage: spot-the-diff <command> [options]

Commands:
  check     Capture every route and compare it with the baselines
  approve   Accept the screenshots of the last check as the new baselines

Options:
  --config <path>      Config file (default: visual.config.json)
  --baselines <dir>    Approved screenshots (default: .spot-the-diff/baselines)
  --output <dir>       Screenshots, diffs and report of this run (default: .spot-the-diff/current)
  --fail-on-diff       Exit with code 1 when any screen changed
  -h, --help           Show this help`;

const OPTIONS = {
  config: { type: 'string', default: 'visual.config.json' },
  baselines: { type: 'string', default: '.spot-the-diff/baselines' },
  output: { type: 'string', default: '.spot-the-diff/current' },
  'fail-on-diff': { type: 'boolean', default: false },
  help: { type: 'boolean', short: 'h', default: false },
} as const;

/** Turns the raw terminal arguments into a typed command, rejecting anything unknown. */
export function parseCliArgs(argv: string[]): CliCommand {
  const { values, positionals } = readArgs(argv);
  const [commandName, ...extraArguments] = positionals;

  if (extraArguments.length > 0) {
    throw new CliUsageError('CLI_INVALID_OPTION', `Unexpected argument "${extraArguments.join(' ')}" after "${commandName}". When running through pnpm, leave out the "--" before the options.`);
  }

  if (values.help || commandName === undefined) return { name: 'help' };

  if (commandName === 'check') {
    return {
      name: 'check',
      configPath: values.config,
      baselineDir: values.baselines,
      outputDir: values.output,
      failOnDiff: values['fail-on-diff'],
    };
  }

  if (commandName === 'approve') {
    return { name: 'approve', baselineDir: values.baselines, outputDir: values.output };
  }

  throw new CliUsageError('CLI_UNKNOWN_COMMAND', `Unknown command "${commandName}". Use "check" or "approve".`);
}

/** Node's parseArgs throws a plain TypeError; it is turned into our own error at this boundary. */
function readArgs(argv: string[]) {
  try {
    return parseArgs({ args: argv, options: OPTIONS, allowPositionals: true, strict: true });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new CliUsageError('CLI_INVALID_OPTION', reason);
  }
}