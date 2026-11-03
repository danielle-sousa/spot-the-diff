import { describe, expect, it } from 'vitest';
import { getComparisonVerdict } from './comparison-verdict.ts';

describe('getComparisonVerdict', () => {
  it('treats a screenshot with no changed pixels as unchanged', () => {
    const verdict = getComparisonVerdict({ changedPixels: 0, totalPixels: 1000, maxDiffPercent: 0.5 });
    expect(verdict).toEqual({ status: 'unchanged', diffPercent: 0 });
  });

  it('treats a difference exactly at the tolerance as unchanged', () => {
    const verdict = getComparisonVerdict({ changedPixels: 5, totalPixels: 1000, maxDiffPercent: 0.5 });
    expect(verdict).toEqual({ status: 'unchanged', diffPercent: 0.5 });
  });

  it('flags a difference above the tolerance as changed', () => {
    const verdict = getComparisonVerdict({ changedPixels: 24, totalPixels: 1000, maxDiffPercent: 0.5 });
    expect(verdict).toEqual({ status: 'changed', diffPercent: 2.4 });
  });

  it('rejects a screenshot with no pixels', () => {
    expect(() => getComparisonVerdict({ changedPixels: 0, totalPixels: 0, maxDiffPercent: 0.5 })).toThrow(RangeError);
  });
});