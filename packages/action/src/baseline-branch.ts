import { rm } from 'node:fs/promises';
import { git, gitSucceeds } from './git.ts';

export interface OpenBaselineBranchOptions {
  /** The repository checked out by actions/checkout. */
  repoDir: string;
  /** Orphan branch that stores baselines and pull request screenshots. */
  branch: string;
  /** Where to check the branch out. It must not exist yet. */
  dir: string;
}

export interface BaselineBranch {
  dir: string;
  /** Commits every change in `dir`, pushes it and returns the resulting commit SHA. */
  commitAndPush(message: string): Promise<string>;
  close(): Promise<void>;
}

const MAX_PUSH_ATTEMPTS = 3;

/**
 * Checks the baseline branch out next to the main checkout with `git worktree`,
 * so the code under test is never touched. The branch is orphan: it shares no
 * history with the code, so images never bloat the main branch. On the very
 * first run the branch does not exist yet and is created empty.
 */
export async function openBaselineBranch({ repoDir, branch, dir }: OpenBaselineBranchOptions): Promise<BaselineBranch> {
  const branchExists = await gitSucceeds(repoDir, ['ls-remote', '--exit-code', '--heads', 'origin', branch]);

  if (branchExists) {
    await git(repoDir, ['fetch', '--depth', '1', 'origin', branch]);
    await git(repoDir, ['worktree', 'add', '--detach', dir, 'FETCH_HEAD']);
  } else {
    await git(repoDir, ['worktree', 'add', '--orphan', '-b', branch, dir]);
  }

  return {
    dir,
    commitAndPush: (message) => commitAndPush(dir, branch, message),
    close: async () => {
      await git(repoDir, ['worktree', 'remove', '--force', dir]);
      await rm(dir, { recursive: true, force: true });
    },
  };
}

async function commitAndPush(dir: string, branch: string, message: string): Promise<string> {
  await git(dir, ['add', '--all']);
  const hasChanges = !(await gitSucceeds(dir, ['diff', '--cached', '--quiet']));
  if (hasChanges) {
    await git(dir, ['commit', '--message', message]);
    await pushWithRetry(dir, branch);
  }
  return git(dir, ['rev-parse', 'HEAD']);
}

/**
 * Two pull requests can finish at the same moment and both push to the
 * baseline branch. Each writes to its own folder, so the loser of the race
 * can always rebase onto the winner's commit and try again.
 */
async function pushWithRetry(dir: string, branch: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    if (await gitSucceeds(dir, ['push', 'origin', `HEAD:refs/heads/${branch}`])) return;
    if (attempt === MAX_PUSH_ATTEMPTS) break;

    await git(dir, ['fetch', '--depth', '1', 'origin', branch]);
    await git(dir, ['rebase', 'FETCH_HEAD']);
  }
  throw new Error(`Could not push to the ${branch} branch after ${MAX_PUSH_ATTEMPTS} attempts.`);
}