import * as core from '@actions/core';

export interface ActionInputs {
  configPath: string;
  baselineBranch: string;
  failOnDiff: boolean;
  githubToken: string;
}

/**
 * Reads the `with:` values of the workflow step. A composite action does not
 * hand its inputs to scripts on its own: action.yml passes each one as an
 * INPUT_* environment variable. Those names use underscores, because shells
 * cannot read variables with hyphens, so they are read here by that name.
 * Defaults live in action.yml, the single source of truth.
 */
export function readActionInputs(): ActionInputs {
  return {
    configPath: core.getInput('config', { required: true }),
    baselineBranch: core.getInput('baseline_branch', { required: true }),
    failOnDiff: core.getBooleanInput('fail_on_diff'),
    githubToken: core.getInput('github_token', { required: true }),
  };
}