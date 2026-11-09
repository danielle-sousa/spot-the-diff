import type { context } from '@actions/github';
import type { EventContext } from './run-target.ts';

/**
 * Maps the loosely typed GitHub context into the shape the Action relies on.
 * Webhook payloads are typed with `any` for most fields, so every field we
 * read is checked here, once, instead of trusted all over the code.
 */
export function toEventContext(githubContext: typeof context): EventContext {
  const pullRequest = githubContext.payload.pull_request;

  return {
    eventName: githubContext.eventName,
    sha: githubContext.sha,
    ref: githubContext.ref,
    payload: {
      repository: { default_branch: githubContext.payload.repository?.default_branch },
      pull_request: pullRequest && {
        number: pullRequest.number,
        head: { sha: readHeadSha(pullRequest.head) },
        labels: readLabels(pullRequest.labels),
      },
    },
  };
}

function readHeadSha(head: unknown): string {
  if (typeof head === 'object' && head !== null && 'sha' in head && typeof head.sha === 'string') return head.sha;
  throw new Error('The pull_request event has no head commit SHA.');
}

function readLabels(labels: unknown): { name: string }[] {
  if (!Array.isArray(labels)) return [];
  return labels
    .filter((label): label is { name: string } => typeof label?.name === 'string')
    .map((label) => ({ name: label.name }));
}