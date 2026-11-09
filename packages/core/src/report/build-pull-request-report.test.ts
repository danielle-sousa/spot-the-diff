import { describe, expect, it } from 'vitest';
import type { ScreenshotResult } from '../run/run-visual-check.ts';
import { REPORT_MARKER, buildPullRequestReport, countResultsByStatus } from './build-pull-request-report.ts';

const imageUrl = (filePath: string): string => `https://images.test/${filePath}`;

function buildChanged(name: string, diffPercent: number): ScreenshotResult {
  return {
    status: 'changed',
    name,
    diffPercent,
    baselinePath: `baselines/${name}.png`,
    currentPath: `current/${name}.png`,
    diffPath: `current/${name}.diff.png`,
  };
}

function buildUnchanged(name: string): ScreenshotResult {
  return { status: 'unchanged', name, diffPercent: 0, baselinePath: `baselines/${name}.png`, currentPath: `current/${name}.png` };
}

function buildNew(name: string): ScreenshotResult {
  return { status: 'new', name, currentPath: `current/${name}.png` };
}

describe('countResultsByStatus', () => {
  it('counts each status', () => {
    const counts = countResultsByStatus([buildChanged('extrato--mobile', 2), buildUnchanged('home--mobile'), buildUnchanged('home--desktop')]);

    expect(counts).toEqual({ changed: 1, unchanged: 2, new: 0 });
  });
});

describe('buildPullRequestReport', () => {
  it('starts with the hidden marker so the comment can be found again', () => {
    const report = buildPullRequestReport([buildUnchanged('home--mobile')], { imageUrl });

    expect(report.startsWith(REPORT_MARKER)).toBe(true);
  });

  it('says so when nothing changed', () => {
    const report = buildPullRequestReport([buildUnchanged('home--mobile')], { imageUrl });

    expect(report).toContain('0 changed · 1 unchanged · 0 new');
    expect(report).toContain('No visual changes found');
  });

  it('lists changed screens with the biggest change first', () => {
    const report = buildPullRequestReport([buildChanged('home--mobile', 0.8), buildChanged('extrato--mobile', 2.4)], { imageUrl });

    expect(report.indexOf('| extrato--mobile |')).toBeLessThan(report.indexOf('| home--mobile |'));
    expect(report).toContain('| extrato--mobile | 🔴 changed | 2.4% |');
  });

  it('shows before, after and diff images with descriptive alt text', () => {
    const report = buildPullRequestReport([buildChanged('extrato--mobile', 2.4)], { imageUrl });

    expect(report).toContain('![extrato--mobile before](https://images.test/baselines/extrato--mobile.png)');
    expect(report).toContain('![extrato--mobile after](https://images.test/current/extrato--mobile.png)');
    expect(report).toContain('![extrato--mobile diff, changed pixels in red](https://images.test/current/extrato--mobile.diff.png)');
  });

  it('shows new screens without a diff', () => {
    const report = buildPullRequestReport([buildNew('cartoes--desktop')], { imageUrl });

    expect(report).toContain('| cartoes--desktop | 🆕 new | — |');
    expect(report).toContain('![cartoes--desktop screenshot](https://images.test/current/cartoes--desktop.png)');
  });

  it('keeps unchanged screens out of the table', () => {
    const report = buildPullRequestReport([buildChanged('extrato--mobile', 2.4), buildUnchanged('home--mobile')], { imageUrl });

    expect(report).not.toContain('| home--mobile |');
  });
});