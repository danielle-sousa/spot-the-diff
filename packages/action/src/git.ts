import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

/**
 * Commits made by the Action are attributed to the GitHub Actions bot, the
 * same identity GitHub shows for workflow commits.
 */
const BOT_IDENTITY = [
  '-c', 'user.name=github-actions[bot]',
  '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com',
];

/** Runs git and returns its trimmed output. execFile, unlike exec, never passes arguments through a shell. */
export async function git(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', [...BOT_IDENTITY, ...args], { cwd });
  return stdout.trim();
}

/** Runs git where a non-zero exit is an answer ("no", "missing"), not a failure. */
export async function gitSucceeds(cwd: string, args: string[]): Promise<boolean> {
  try {
    await git(cwd, args);
    return true;
  } catch {
    return false;
  }
}