import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openScreenshotSession, type ScreenshotSession } from '../capture/screenshot-session.ts';
import { compareScreenshots } from '../compare/compare-screenshots.ts';
import { getComparisonVerdict } from '../compare/comparison-verdict.ts';
import type { RouteConfig, ViewportConfig, VisualConfig } from '../config/visual-config.ts';
import { getScreenshotName, resolveRouteUrl } from './screenshot-naming.ts';

export interface RunVisualCheckOptions {
  config: VisualConfig;
  /** Folder with the approved screenshots from the main branch. */
  baselineDir: string;
  /** Folder where this run writes its screenshots and diff images. */
  outputDir: string;
}

export type ScreenshotResult =
  | { status: 'new'; name: string; currentPath: string }
  | { status: 'unchanged'; name: string; diffPercent: number; currentPath: string; baselinePath: string }
  | { status: 'changed'; name: string; diffPercent: number; currentPath: string; baselinePath: string; diffPath: string };

/**
 * Captures every route at every viewport and compares each screenshot with
 * its baseline. Screenshots without a baseline are reported as new rather
 * than failing, since the first run of any project has no baselines yet.
 */
export async function runVisualCheck(options: RunVisualCheckOptions): Promise<ScreenshotResult[]> {
  await mkdir(options.outputDir, { recursive: true });
  const session = await openScreenshotSession();

  try {
    const results: ScreenshotResult[] = [];
    for (const route of options.config.routes) {
      for (const viewport of options.config.viewports) {
        results.push(await checkScreenshot(session, route, viewport, options));
      }
    }
    return results;
  } finally {
    await session.close();
  }
}

async function checkScreenshot(
  session: ScreenshotSession,
  route: RouteConfig,
  viewport: ViewportConfig,
  { config, baselineDir, outputDir }: RunVisualCheckOptions,
): Promise<ScreenshotResult> {
  const name = getScreenshotName(route, viewport);
  const current = await session.capture({
    url: resolveRouteUrl(config.baseUrl, route.path),
    viewport,
    waitFor: route.waitFor,
    mask: route.mask,
  });

  const currentPath = join(outputDir, `${name}.png`);
  await writeFile(currentPath, current);

  const baselinePath = join(baselineDir, `${name}.png`);
  const baseline = await readFileIfExists(baselinePath);
  if (!baseline) return { status: 'new', name, currentPath };

  const comparison = compareScreenshots(baseline, current, { threshold: config.threshold });
  const verdict = getComparisonVerdict({ ...comparison, maxDiffPercent: config.maxDiffPercent });
  if (verdict.status === 'unchanged') {
    return { status: 'unchanged', name, diffPercent: verdict.diffPercent, currentPath, baselinePath };
  }

  const diffPath = join(outputDir, `${name}.diff.png`);
  await writeFile(diffPath, comparison.diffImage);
  return { status: 'changed', name, diffPercent: verdict.diffPercent, currentPath, baselinePath, diffPath };
}

/** A missing baseline is expected; any other read error (permissions, a folder in the way) is not. */
async function readFileIfExists(filePath: string): Promise<Buffer | undefined> {
  try {
    return await readFile(filePath);
  } catch (error) {
    if (isFileNotFound(error)) return undefined;
    throw error;
  }
}

function isFileNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}