import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { compareScreenshots } from './compare-screenshots.ts';

type Rgb = [number, number, number];

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

function buildScreenshot(width: number, height: number, color: Rgb = WHITE): PNG {
  const image = new PNG({ width, height });
  for (let offset = 0; offset < image.data.length; offset += 4) {
    image.data.set([...color, 255], offset);
  }
  return image;
}

function paintPixel(image: PNG, x: number, y: number, color: Rgb): PNG {
  image.data.set([...color, 255], (y * image.width + x) * 4);
  return image;
}

function toBuffer(image: PNG): Buffer {
  return PNG.sync.write(image);
}

describe('compareScreenshots', () => {
  it('finds no changed pixels between identical screenshots', () => {
    const baseline = toBuffer(buildScreenshot(10, 10));
    const current = toBuffer(buildScreenshot(10, 10));

    const comparison = compareScreenshots(baseline, current);

    expect(comparison.changedPixels).toBe(0);
    expect(comparison.totalPixels).toBe(100);
  });

  it('counts a single pixel that changed color', () => {
    const baseline = toBuffer(buildScreenshot(10, 10));
    const current = toBuffer(paintPixel(buildScreenshot(10, 10), 4, 4, BLACK));

    const comparison = compareScreenshots(baseline, current);

    expect(comparison.changedPixels).toBe(1);
  });

  it('counts rows that exist in only one screenshot as changed', () => {
    const baseline = toBuffer(buildScreenshot(10, 10));
    const current = toBuffer(buildScreenshot(10, 12));

    const comparison = compareScreenshots(baseline, current);

    expect(comparison.changedPixels).toBe(20);
    expect(comparison.totalPixels).toBe(120);
  });

  it('returns a diff image covering both screenshots', () => {
    const baseline = toBuffer(buildScreenshot(10, 10));
    const current = toBuffer(buildScreenshot(8, 12));

    const comparison = compareScreenshots(baseline, current);
    const diffImage = PNG.sync.read(comparison.diffImage);

    expect(diffImage.width).toBe(10);
    expect(diffImage.height).toBe(12);
  });
});