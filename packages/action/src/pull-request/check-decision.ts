import type { ResultCounts } from '@spot-the-diff/core';

/**
 * Adding this label to a pull request tells spot-the-diff the visual changes
 * were reviewed on purpose, so the check passes on the next run.
 */
export const APPROVAL_LABEL = 'visual-approved';

export function shouldFailCheck(counts: ResultCounts, failOnDiff: boolean, labels: string[]): boolean {
  if (!failOnDiff) return false;
  if (labels.includes(APPROVAL_LABEL)) return false;
  return counts.changed > 0;
}