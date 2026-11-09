import type { ScreenshotResult } from '@spot-the-diff/core';
import { describe, expect, it } from 'vitest';
import { EXIT_CODE, formatTerminalSummary, getCheckExitCode } from './check-outcome.ts';

describe('getCheckExitCode', () => {
  it('passes when nothing changed', () => {
    expect(getCheckExitCode({ changed: 0, unchanged: 3, new: 1 }, true)).toBe(EXIT_CODE.ok);
  });

  it('fails on changes when asked to', () => {
    expect(getCheckExitCode({ changed: 1, unchanged: 3, new: 0 }, true)).toBe(EXIT_CODE.visualChanges);
  });

  it('passes on changes when not asked to fail', () => {
    expect(getCheckExitCode({ changed: 1, unchanged: 3, new: 0 }, false)).toBe(EXIT_CODE.ok);
  });
});

describe('formatTerminalSummary', () => {
  it('lists changed and new screens under the totals', () => {
    const results: ScreenshotResult[] = [
      { status: 'changed', name: 'extrato--mobile', diffPercent: 1.5675, baselinePath: 'b', currentPath: 'c', diffPath: 'd' },
      { status: 'unchanged', name: 'home--mobile', diffPercent: 0, baselinePath: 'b', currentPath: 'c' },
      { status: 'new', name: 'cartoes--mobile', currentPath: 'c' },
    ];

    const lines = formatTerminalSummary(results, { changed: 1, unchanged: 1, new: 1 });

    expect(lines).toEqual([
      'spot-the-diff · 1 changed · 1 unchanged · 1 new',
      '  changed  extrato--mobile  1.57%',
      '  new      cartoes--mobile',
    ]);
  });
});