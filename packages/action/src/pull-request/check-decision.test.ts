import { describe, expect, it } from 'vitest';
import { APPROVAL_LABEL, shouldFailCheck } from './check-decision.ts';

const withChanges = { changed: 2, unchanged: 5, new: 0 };

describe('shouldFailCheck', () => {
  it('fails on changes when fail-on-diff is on', () => {
    expect(shouldFailCheck(withChanges, true, [])).toBe(true);
  });

  it('passes once the changes are approved with the label', () => {
    expect(shouldFailCheck(withChanges, true, [APPROVAL_LABEL])).toBe(false);
  });

  it('never fails when fail-on-diff is off', () => {
    expect(shouldFailCheck(withChanges, false, [])).toBe(false);
  });

  it('does not fail for new screens alone', () => {
    expect(shouldFailCheck({ changed: 0, unchanged: 5, new: 2 }, true, [])).toBe(false);
  });
});