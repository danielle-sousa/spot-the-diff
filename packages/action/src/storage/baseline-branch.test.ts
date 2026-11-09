import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { openBaselineBranch } from './baseline-branch.ts';
import { git } from './git.ts';

const BRANCH = 'visual-baselines';

/** A bare repository plays GitHub; each clone plays one workflow run. */
async function setUpRemoteAndClone(workDir: string, cloneName: string): Promise<string> {
  const remoteDir = join(workDir, 'remote.git');
  const cloneDir = join(workDir, cloneName);
  await git(workDir, ['clone', remoteDir, cloneDir]);
  return cloneDir;
}

describe('openBaselineBranch', () => {
  let workDir = '';

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), 'spot-the-diff-git-'));
    await git(workDir, ['init', '--bare', '--initial-branch', 'main', 'remote.git']);
    const seedDir = await setUpRemoteAndClone(workDir, 'seed');
    await writeFile(join(seedDir, 'README.md'), '# app');
    await git(seedDir, ['add', '--all']);
    await git(seedDir, ['commit', '--message', 'initial commit']);
    await git(seedDir, ['push', 'origin', 'HEAD:refs/heads/main']);
  });

  afterEach(async () => {
    await rm(workDir, { recursive: true, force: true });
  });

  it('creates the branch on the first run and finds it on the next', async () => {
    const firstRun = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run-1'), branch: BRANCH, dir: join(workDir, 'branch-1') });
    await writeFile(join(firstRun.dir, 'home--mobile.png'), 'first');
    await firstRun.commitAndPush('Record baselines');
    await firstRun.close();

    const secondRun = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run-2'), branch: BRANCH, dir: join(workDir, 'branch-2') });

    expect(await readFile(join(secondRun.dir, 'home--mobile.png'), 'utf8')).toBe('first');
    await secondRun.close();
  });

  it('keeps both runs when two pull requests push at the same time', async () => {
    const seedRun = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'seed-run'), branch: BRANCH, dir: join(workDir, 'branch-seed') });
    await writeFile(join(seedRun.dir, 'baseline.png'), 'seed');
    await seedRun.commitAndPush('Record baselines');
    await seedRun.close();

    const runA = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run-a'), branch: BRANCH, dir: join(workDir, 'branch-a') });
    const runB = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run-b'), branch: BRANCH, dir: join(workDir, 'branch-b') });
    await writeFile(join(runA.dir, 'pr-1.png'), 'a');
    await writeFile(join(runB.dir, 'pr-2.png'), 'b');

    await runA.commitAndPush('Screenshots for PR #1');
    await runB.commitAndPush('Screenshots for PR #2');
    await runA.close();
    await runB.close();

    const checkRun = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run-check'), branch: BRANCH, dir: join(workDir, 'branch-check') });
    expect(await readFile(join(checkRun.dir, 'pr-1.png'), 'utf8')).toBe('a');
    expect(await readFile(join(checkRun.dir, 'pr-2.png'), 'utf8')).toBe('b');
    await checkRun.close();
  });

  it('returns the same commit when there is nothing new to save', async () => {
    const run = await openBaselineBranch({ repoDir: await setUpRemoteAndClone(workDir, 'run'), branch: BRANCH, dir: join(workDir, 'branch') });
    await writeFile(join(run.dir, 'home--mobile.png'), 'same');
    const firstSha = await run.commitAndPush('Record baselines');

    const secondSha = await run.commitAndPush('Record baselines again');

    expect(secondSha).toBe(firstSha);
    await run.close();
  });
});