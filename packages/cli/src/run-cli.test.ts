import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EXIT_CODE } from './output/check-outcome.ts';
import { runCli, type CliOutput } from './run-cli.ts';

function captureOutput(): CliOutput & { lines: string[]; errors: string[] } {
  const lines: string[] = [];
  const errors: string[] = [];
  return { lines, errors, info: (line) => lines.push(line), error: (line) => errors.push(line) };
}

describe('runCli', () => {
  let workDir = '';

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'spot-the-diff-cli-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('shows the help when called without a command', async () => {
    const output = captureOutput();

    const exitCode = await runCli([], output);

    expect(exitCode).toBe(EXIT_CODE.ok);
    expect(output.lines.join('\n')).toContain('Usage: spot-the-diff');
  });

  it('rejects an unknown command with a usage error', async () => {
    const output = captureOutput();

    const exitCode = await runCli(['capture'], output);

    expect(exitCode).toBe(EXIT_CODE.usageError);
    expect(output.errors.join('\n')).toContain('Unknown command "capture"');
  });

  it('explains a missing config file instead of crashing', async () => {
    const output = captureOutput();

    const exitCode = await runCli(['check', '--config', join(workDir, 'missing.json')], output);

    expect(exitCode).toBe(EXIT_CODE.usageError);
    expect(output.errors.join('\n')).toContain('Config file not found');
  });

  it('approves screenshots but leaves diff images behind', async () => {
    const outputDir = join(workDir, 'current');
    const baselineDir = join(workDir, 'baselines');
    await mkdir(outputDir);
    await writeFile(join(outputDir, 'home--mobile.png'), 'png');
    await writeFile(join(outputDir, 'home--mobile.diff.png'), 'png');
    await writeFile(join(outputDir, 'report.md'), '# report');

    const exitCode = await runCli(['approve', '--output', outputDir, '--baselines', baselineDir], captureOutput());

    expect(exitCode).toBe(EXIT_CODE.ok);
    expect(await readdir(baselineDir)).toEqual(['home--mobile.png']);
  });

  it('refuses to approve before any check has run', async () => {
    const output = captureOutput();

    const exitCode = await runCli(['approve', '--output', join(workDir, 'nothing-here')], output);

    expect(exitCode).toBe(EXIT_CODE.usageError);
    expect(output.errors.join('\n')).toContain('Run "spot-the-diff check" first');
  });
});