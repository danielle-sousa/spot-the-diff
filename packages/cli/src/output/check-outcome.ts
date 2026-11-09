import { formatDiffPercent, type ResultCounts, type ScreenshotResult } from '@spot-the-diff/core';

export const EXIT_CODE = {
  ok: 0,
  visualChanges: 1,
  usageError: 2,
} as const;

/**
 * Changes only fail the run when the caller opted in with --fail-on-diff.
 * Locally people usually want to look at the report; in CI they want a red check.
 */
export function getCheckExitCode(counts: ResultCounts, failOnDiff: boolean): number {
  if (failOnDiff && counts.changed > 0) return EXIT_CODE.visualChanges;
  return EXIT_CODE.ok;
}

/** One line per screen that needs attention, aligned so names and numbers form columns. */
export function formatTerminalSummary(results: ScreenshotResult[], counts: ResultCounts): string[] {
  const header = `spot-the-diff · ${counts.changed} changed · ${counts.unchanged} unchanged · ${counts.new} new`;
  const nameWidth = Math.max(0, ...results.map((result) => result.name.length));

  const lines = results.flatMap((result) => {
    if (result.status === 'changed') return [`  changed  ${result.name.padEnd(nameWidth)}  ${formatDiffPercent(result.diffPercent)}`];
    if (result.status === 'new') return [`  new      ${result.name}`];
    return [];
  });

  return [header, ...lines];
}