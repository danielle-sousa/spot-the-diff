import { describe, expect, it } from 'vitest';
import { formatDiffPercent } from './format-diff-percent.ts';

describe('formatDiffPercent', () => {
  it('rounds to two decimal places', () => {
    expect(formatDiffPercent(1.5675000000000001)).toBe('1.57%');
  });

  it('drops trailing zeros', () => {
    expect(formatDiffPercent(2.5)).toBe('2.5%');
  });

  it('shows a tiny change as below the smallest step instead of zero', () => {
    expect(formatDiffPercent(0.004)).toBe('<0.01%');
  });

  it('shows no change as zero', () => {
    expect(formatDiffPercent(0)).toBe('0%');
  });
});