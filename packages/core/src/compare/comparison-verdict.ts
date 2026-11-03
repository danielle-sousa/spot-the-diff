export interface ComparisonInput {
  changedPixels: number;
  totalPixels: number;
  /** Highest share of changed pixels, in percent, that still counts as no visual change. */
  maxDiffPercent: number;
}

export type ComparisonVerdict =
  | { status: 'unchanged'; diffPercent: number }
  | { status: 'changed'; diffPercent: number };

/**
 * Decides whether a screenshot changed enough to be reported in the pull request.
 * Kept pure so the rule can be tested without images or a browser.
 */
export function getComparisonVerdict(input: ComparisonInput): ComparisonVerdict {
  if (input.totalPixels <= 0) {
    throw new RangeError('totalPixels must be greater than zero');
  }

  const diffPercent = (input.changedPixels / input.totalPixels) * 100;

  if (diffPercent <= input.maxDiffPercent) {
    return { status: 'unchanged', diffPercent };
  }

  return { status: 'changed', diffPercent };
}