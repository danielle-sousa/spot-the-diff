import * as core from '@actions/core';

export interface ActionInputs {
  configPath: string;
  baselineBranch: string;
  failOnDiff: boolean;
  githubToken: string;
}

/** Reads the `with:` values of the workflow step. Defaults live in action.yml, the single source of truth. */
export function readActionInputs(): ActionInputs {
  return {
    configPath: core.getInput('config', { required: true }),
    baselineBranch: core.getInput('baseline-branch', { required: true }),
    failOnDiff: core.getBooleanInput('fail-on-diff'),
    githubToken: core.getInput('github-token', { required: true }),
  };
}