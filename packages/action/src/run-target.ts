/** The few fields of the GitHub event this Action reads. Mirrors `github.context`. */
export interface EventContext {
  eventName: string;
  sha: string;
  ref: string;
  payload: {
    pull_request?: { number: number; head: { sha: string }; labels?: { name: string }[] };
    repository?: { default_branch?: string };
  };
}

export type RunTarget =
  | { kind: 'pull-request'; number: number; headSha: string; labels: string[] }
  | { kind: 'baseline-update'; sha: string }
  | { kind: 'unsupported'; reason: string };

/**
 * Decides what this run is for. Pull requests are checked against the
 * baselines; a push to the default branch records new baselines, because
 * whatever reached that branch was already reviewed.
 */
export function getRunTarget(context: EventContext): RunTarget {
  const pullRequest = context.payload.pull_request;
  if (pullRequest) {
    return {
      kind: 'pull-request',
      number: pullRequest.number,
      headSha: pullRequest.head.sha,
      labels: (pullRequest.labels ?? []).map((label) => label.name),
    };
  }

  if (context.eventName !== 'push') {
    return { kind: 'unsupported', reason: `The "${context.eventName}" event is not supported. Use pull_request or push.` };
  }

  const defaultBranch = context.payload.repository?.default_branch;
  if (context.ref !== `refs/heads/${defaultBranch}`) {
    return { kind: 'unsupported', reason: `Baselines are only recorded on pushes to ${defaultBranch}, not ${context.ref}.` };
  }

  return { kind: 'baseline-update', sha: context.sha };
}