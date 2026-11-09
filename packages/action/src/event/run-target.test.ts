import { describe, expect, it } from 'vitest';
import { getRunTarget, type EventContext } from './run-target.ts';

function buildContext(overrides: Partial<EventContext>): EventContext {
  return {
    eventName: 'push',
    sha: 'abc123',
    ref: 'refs/heads/main',
    payload: { repository: { default_branch: 'main' } },
    ...overrides,
  };
}

describe('getRunTarget', () => {
  it('checks pull requests against the baselines', () => {
    const target = getRunTarget(buildContext({
      eventName: 'pull_request',
      payload: { pull_request: { number: 7, head: { sha: 'def456' }, labels: [{ name: 'visual-approved' }] } },
    }));

    expect(target).toEqual({ kind: 'pull-request', number: 7, headSha: 'def456', labels: ['visual-approved'] });
  });

  it('records baselines on a push to the default branch', () => {
    expect(getRunTarget(buildContext({}))).toEqual({ kind: 'baseline-update', sha: 'abc123' });
  });

  it('respects a default branch other than main', () => {
    const target = getRunTarget(buildContext({ ref: 'refs/heads/develop', payload: { repository: { default_branch: 'develop' } } }));

    expect(target.kind).toBe('baseline-update');
  });

  it('ignores pushes to other branches', () => {
    expect(getRunTarget(buildContext({ ref: 'refs/heads/feature/login' })).kind).toBe('unsupported');
  });

  it('ignores other events', () => {
    expect(getRunTarget(buildContext({ eventName: 'schedule' })).kind).toBe('unsupported');
  });
});