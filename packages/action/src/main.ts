import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import * as core from '@actions/core';
import * as github from '@actions/github';
import {
  buildPullRequestReport,
  copyScreenshotsToBaselines,
  countResultsByStatus,
  loadVisualConfig,
  runVisualCheck,
  type VisualConfig,
} from '@spot-the-diff/core';
import { readActionInputs, type ActionInputs } from './action-inputs.ts';
import { openBaselineBranch, type BaselineBranch } from './baseline-branch.ts';
import { APPROVAL_LABEL, shouldFailCheck } from './check-decision.ts';
import { createGitHubCommentApi } from './github-comment-api.ts';
import { toEventContext } from './github-event.ts';
import { createImageUrl } from './image-url.ts';
import { upsertReportComment } from './report-comment.ts';
import { getRunTarget, type RunTarget } from './run-target.ts';

type PullRequestTarget = Extract<RunTarget, { kind: 'pull-request' }>;
type BaselineUpdateTarget = Extract<RunTarget, { kind: 'baseline-update' }>;

const BASELINES_FOLDER = 'baselines';

async function run(): Promise<void> {
  const inputs = readActionInputs();
  const target = getRunTarget(toEventContext(github.context));
  if (target.kind === 'unsupported') {
    core.notice(target.reason);
    return;
  }

  const config = await loadVisualConfig(inputs.configPath);
  const branch = await openBaselineBranch({
    repoDir: process.cwd(),
    branch: inputs.baselineBranch,
    dir: join(runnerTempDir(), 'spot-the-diff-branch'),
  });

  try {
    if (target.kind === 'baseline-update') {
      await recordBaselines(config, branch, target);
    } else {
      await checkPullRequest(config, branch, target, inputs);
    }
  } finally {
    await branch.close();
  }
}

async function recordBaselines(config: VisualConfig, branch: BaselineBranch, target: BaselineUpdateTarget): Promise<void> {
  const outputDir = await mkdtemp(join(runnerTempDir(), 'spot-the-diff-run-'));
  await runVisualCheck({ config, baselineDir: join(branch.dir, BASELINES_FOLDER), outputDir });

  const recorded = await copyScreenshotsToBaselines(outputDir, join(branch.dir, BASELINES_FOLDER));
  const commitSha = await branch.commitAndPush(`Record baselines for ${target.sha.slice(0, 7)}`);
  core.info(`Recorded ${recorded.length} baselines at ${commitSha}`);
}

async function checkPullRequest(config: VisualConfig, branch: BaselineBranch, target: PullRequestTarget, inputs: ActionInputs): Promise<void> {
  const results = await runVisualCheck({
    config,
    baselineDir: join(branch.dir, BASELINES_FOLDER),
    outputDir: join(branch.dir, 'prs', String(target.number), target.headSha),
  });
  const commitSha = await branch.commitAndPush(`Screenshots for PR #${target.number} at ${target.headSha.slice(0, 7)}`);

  const { owner, repo } = github.context.repo;
  const report = buildPullRequestReport(results, {
    imageUrl: createImageUrl({ serverUrl: github.context.serverUrl, owner, repo, commitSha, branchDir: branch.dir }),
  });

  const commentApi = createGitHubCommentApi(github.getOctokit(inputs.githubToken), owner, repo);
  const outcome = await upsertReportComment(commentApi, target.number, report);
  core.info(`Report comment ${outcome} on PR #${target.number}`);
  await core.summary.addRaw(report).write();

  const counts = countResultsByStatus(results);
  core.setOutput('changed', counts.changed);
  core.setOutput('new', counts.new);

  if (shouldFailCheck(counts, inputs.failOnDiff, target.labels)) {
    core.setFailed(`${counts.changed} screens changed. Review the spot-the-diff comment and add the "${APPROVAL_LABEL}" label to approve them.`);
  }
}

/** GitHub gives every job a scratch folder that is wiped afterwards; outside Actions, fall back to the OS one. */
function runnerTempDir(): string {
  return process.env.RUNNER_TEMP ?? tmpdir();
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});