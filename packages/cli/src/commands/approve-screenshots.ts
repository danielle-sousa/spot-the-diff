import { copyScreenshotsToBaselines } from '@spot-the-diff/core';
import { CliUsageError } from '../cli-usage-error.ts';

/** Accepts the screenshots of the last check as the new baselines. */
export async function approveScreenshots(outputDir: string, baselineDir: string): Promise<string[]> {
  const approved = await copyScreenshotsToBaselines(outputDir, baselineDir);

  if (approved.length === 0) {
    throw new CliUsageError('CLI_NOTHING_TO_APPROVE', `No screenshots found in ${outputDir}. Run "spot-the-diff check" first.`);
  }

  return approved;
}