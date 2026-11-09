import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CliUsageError } from './cli-usage-error.ts';

/**
 * Copies the screenshots of the last check into the baseline folder.
 * Diff images are skipped: a baseline is always a plain screenshot.
 * Returns the names of the approved files.
 */
export async function approveScreenshots(outputDir: string, baselineDir: string): Promise<string[]> {
  const screenshots = (await listFiles(outputDir)).filter(isApprovableScreenshot);

  if (screenshots.length === 0) {
    throw new CliUsageError('CLI_NOTHING_TO_APPROVE', `No screenshots found in ${outputDir}. Run "spot-the-diff check" first.`);
  }

  await mkdir(baselineDir, { recursive: true });
  for (const fileName of screenshots) {
    await copyFile(join(outputDir, fileName), join(baselineDir, fileName));
  }
  return screenshots;
}

function isApprovableScreenshot(fileName: string): boolean {
  return fileName.endsWith('.png') && !fileName.endsWith('.diff.png');
}

async function listFiles(directory: string): Promise<string[]> {
  try {
    return await readdir(directory);
  } catch {
    return [];
  }
}