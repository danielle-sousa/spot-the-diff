const SMALLEST_SHOWN_PERCENT = 0.01;

/**
 * Formats a diff percentage for people. Rounds away floating point noise
 * (1.5675000000000001 → "1.57%") and never shows a real change as "0%",
 * which would make a reviewer think nothing happened.
 */
export function formatDiffPercent(diffPercent: number): string {
  if (diffPercent === 0) return '0%';
  if (diffPercent < SMALLEST_SHOWN_PERCENT) return `<${SMALLEST_SHOWN_PERCENT}%`;
  return `${Number(diffPercent.toFixed(2))}%`;
}