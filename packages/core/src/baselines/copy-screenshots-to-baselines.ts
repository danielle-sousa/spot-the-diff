import { copyFile, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Copies the screenshots of a run into the baseline folder and returns their
 * file names. Diff images are skipped: a baseline is always a plain screenshot.
 * An empty or missing output folder copies nothing; callers decide whether
 * that is a problem.
 */
export async function copyScreenshotsToBaselines(outputDir: string, baselineDir: string): Promise<string[]> {
  const screenshots = (await listFiles(outputDir)).filter(isScreenshot);
  if (screenshots.length === 0) return [];

  await mkdir(baselineDir, { recursive: true });
  for (const fileName of screenshots) {
    await copyFile(join(outputDir, fileName), join(baselineDir, fileName));
  }
  return screenshots;
}

function isScreenshot(fileName: string): boolean {
  return fileName.endsWith('.png') && !fileName.endsWith('.diff.png');
}

async function listFiles(directory: string): Promise<string[]> {
  try {
    return await readdir(directory);
  } catch {
    return [];
  }
}