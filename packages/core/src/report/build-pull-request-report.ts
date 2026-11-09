import type { ScreenshotResult } from '../run/run-visual-check.ts';
import { formatDiffPercent } from './format-diff-percent.ts';

/**
 * Hidden first line of every report. The Action searches for it to update
 * its own comment instead of adding a new one on every push.
 */
export const REPORT_MARKER = '<!-- spot-the-diff:report -->';

export interface ReportOptions {
  /** Turns a local image path into a URL that GitHub can display in a comment. */
  imageUrl: (filePath: string) => string;
}

export interface ResultCounts {
  changed: number;
  unchanged: number;
  new: number;
}

type ChangedResult = Extract<ScreenshotResult, { status: 'changed' }>;
type NewResult = Extract<ScreenshotResult, { status: 'new' }>;

export function countResultsByStatus(results: ScreenshotResult[]): ResultCounts {
  return {
    changed: results.filter((result) => result.status === 'changed').length,
    unchanged: results.filter((result) => result.status === 'unchanged').length,
    new: results.filter((result) => result.status === 'new').length,
  };
}

/**
 * Builds the markdown for the pull request comment. Only changed and new
 * screenshots get a section of their own; unchanged ones are only counted,
 * so a large app does not bury the one screen that actually changed.
 */
export function buildPullRequestReport(results: ScreenshotResult[], options: ReportOptions): string {
  const counts = countResultsByStatus(results);
  const changed = results
    .filter((result): result is ChangedResult => result.status === 'changed')
    .sort((first, second) => second.diffPercent - first.diffPercent);
  const added = results.filter((result): result is NewResult => result.status === 'new');

  const header = [REPORT_MARKER, '## 🔍 spot-the-diff', formatCounts(counts)];

  if (changed.length === 0 && added.length === 0) {
    return [...header, '✨ No visual changes found.'].join('\n\n');
  }

  return [
    ...header,
    formatSummaryTable(changed, added),
    ...changed.map((result) => formatChangedSection(result, options)),
    ...added.map((result) => formatNewSection(result, options)),
  ].join('\n\n');
}

function formatCounts(counts: ResultCounts): string {
  return `${counts.changed} changed · ${counts.unchanged} unchanged · ${counts.new} new`;
}

function formatSummaryTable(changed: ChangedResult[], added: NewResult[]): string {
  const rows = [
    ...changed.map((result) => `| ${result.name} | 🔴 changed | ${formatDiffPercent(result.diffPercent)} |`),
    ...added.map((result) => `| ${result.name} | 🆕 new | — |`),
  ];
  return ['| Screen | Status | Difference |', '| --- | --- | --- |', ...rows].join('\n');
}

function formatChangedSection(result: ChangedResult, { imageUrl }: ReportOptions): string {
  return formatDetails(`${result.name} · ${formatDiffPercent(result.diffPercent)}`, [
    '| Before | After | Diff |',
    '| --- | --- | --- |',
    `| ${image(`${result.name} before`, imageUrl(result.baselinePath))} | ${image(`${result.name} after`, imageUrl(result.currentPath))} | ${image(`${result.name} diff, changed pixels in red`, imageUrl(result.diffPath))} |`,
  ]);
}

function formatNewSection(result: NewResult, { imageUrl }: ReportOptions): string {
  return formatDetails(`${result.name} · new screen`, [image(`${result.name} screenshot`, imageUrl(result.currentPath))]);
}

/** GitHub only renders markdown inside <details> when blank lines surround it. */
function formatDetails(summary: string, bodyLines: string[]): string {
  return ['<details>', `<summary>${summary}</summary>`, '', ...bodyLines, '', '</details>'].join('\n');
}

function image(altText: string, url: string): string {
  return `![${altText}](${url})`;
}