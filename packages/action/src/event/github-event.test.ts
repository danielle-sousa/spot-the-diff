import type { context } from '@actions/github';
import { describe, expect, it } from 'vitest';
import { toEventContext } from './github-event.ts';

function buildGitHubContext(payload: Record<string, unknown>): typeof context {
  return { eventName: 'pull_request', sha: 'merge-sha', ref: 'refs/pull/7/merge', payload } as unknown as typeof context;
}

describe('toEventContext', () => {
  it('reads the pull request number, head commit and label names', () => {
    const eventContext = toEventContext(buildGitHubContext({
      pull_request: { number: 7, head: { sha: 'def456' }, labels: [{ name: 'visual-approved', color: 'ff0000' }] },
    }));

    expect(eventContext.payload.pull_request).toEqual({ number: 7, head: { sha: 'def456' }, labels: [{ name: 'visual-approved' }] });
  });

  it('refuses a pull request event without a head commit', () => {
    expect(() => toEventContext(buildGitHubContext({ pull_request: { number: 7 } }))).toThrow('no head commit SHA');
  });
});