import { mkdir, mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { copyScreenshotsToBaselines } from './copy-screenshots-to-baselines.ts';

describe('copyScreenshotsToBaselines', () => {
  let workDir = '';

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'spot-the-diff-baselines-'));
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('copies screenshots but leaves diff images and reports behind', async () => {
    const outputDir = join(workDir, 'current');
    const baselineDir = join(workDir, 'baselines');
    await mkdir(outputDir);
    await writeFile(join(outputDir, 'home--mobile.png'), 'png');
    await writeFile(join(outputDir, 'home--mobile.diff.png'), 'png');
    await writeFile(join(outputDir, 'report.md'), '# report');

    const copied = await copyScreenshotsToBaselines(outputDir, baselineDir);

    expect(copied).toEqual(['home--mobile.png']);
    expect(await readdir(baselineDir)).toEqual(['home--mobile.png']);
  });

  it('copies nothing when the output folder does not exist', async () => {
    const copied = await copyScreenshotsToBaselines(join(workDir, 'missing'), join(workDir, 'baselines'));

    expect(copied).toEqual([]);
  });
});