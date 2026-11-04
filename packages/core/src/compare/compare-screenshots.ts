import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface CompareOptions {
  /** Per-pixel colour tolerance from 0 to 1, passed to pixelmatch. Smaller is stricter. */
  threshold?: number;
}

export interface ScreenshotComparison {
  changedPixels: number;
  totalPixels: number;
  /** PNG with the changed pixels highlighted over a faded copy of the baseline. */
  diffImage: Buffer;
}

const DEFAULT_THRESHOLD = 0.1;
const DIFF_COLOR: [number, number, number] = [255, 0, 0];

/**
 * Compares two PNG screenshots pixel by pixel and draws a diff image.
 *
 * Full-page screenshots often change height between runs (a section was added
 * or removed). pixelmatch only accepts images of the same size, so both are
 * placed on a shared canvas and every pixel that exists in only one of them
 * counts as changed.
 */
export function compareScreenshots(
  baselinePng: Buffer,
  currentPng: Buffer,
  options: CompareOptions = {},
): ScreenshotComparison {
  const baseline = PNG.sync.read(baselinePng);
  const current = PNG.sync.read(currentPng);

  const width = Math.max(baseline.width, current.width);
  const height = Math.max(baseline.height, current.height);
  const overlapWidth = Math.min(baseline.width, current.width);
  const overlapHeight = Math.min(baseline.height, current.height);

  const isOutsideOverlap = (x: number, y: number): boolean => x >= overlapWidth || y >= overlapHeight;
  const ignoreMask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (isOutsideOverlap(x, y)) ignoreMask[y * width + x] = 1;
    }
  }

  const diff = new PNG({ width, height });
  const changedInsideOverlap = pixelmatch(
    padToSize(baseline, width, height).data,
    padToSize(current, width, height).data,
    diff.data,
    width,
    height,
    { threshold: options.threshold ?? DEFAULT_THRESHOLD, diffColor: DIFF_COLOR, ignoreMask },
  );

  ignoreMask.forEach((isIgnored, pixelIndex) => {
    if (isIgnored) diff.data.set([...DIFF_COLOR, 255], pixelIndex * 4);
  });

  const totalPixels = width * height;
  const pixelsOutsideOverlap = totalPixels - overlapWidth * overlapHeight;

  return {
    changedPixels: changedInsideOverlap + pixelsOutsideOverlap,
    totalPixels,
    diffImage: PNG.sync.write(diff),
  };
}

function padToSize(image: PNG, width: number, height: number): PNG {
  if (image.width === width && image.height === height) return image;

  const padded = new PNG({ width, height });
  PNG.bitblt(image, padded, 0, 0, image.width, image.height, 0, 0);
  return padded;
}