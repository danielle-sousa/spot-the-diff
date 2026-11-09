import { describe, expect, it } from 'vitest';
import { CliUsageError } from './cli-usage-error.ts';
import { parseCliArgs } from './parse-cli-args.ts';

describe('parseCliArgs', () => {
  it('uses the default paths for check', () => {
    expect(parseCliArgs(['check'])).toEqual({
      name: 'check',
      configPath: 'visual.config.json',
      baselineDir: '.spot-the-diff/baselines',
      outputDir: '.spot-the-diff/current',
      failOnDiff: false,
    });
  });

  it('reads custom paths and the fail flag', () => {
    const command = parseCliArgs(['check', '--config', 'e2e/visual.json', '--fail-on-diff']);

    expect(command).toMatchObject({ name: 'check', configPath: 'e2e/visual.json', failOnDiff: true });
  });

  it('shows help when no command is given', () => {
    expect(parseCliArgs([])).toEqual({ name: 'help' });
  });

  it('rejects arguments after the command', () => {
    expect(() => parseCliArgs(['check', '--', '--fail-on-diff'])).toThrow('Unexpected argument "--fail-on-diff"');
  });

  it('rejects options it does not know', () => {
    expect(() => parseCliArgs(['check', '--confg', 'x.json'])).toThrow(CliUsageError);
  });
});