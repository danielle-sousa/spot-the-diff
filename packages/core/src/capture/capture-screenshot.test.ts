import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { captureScreenshot } from './capture-screenshot.ts';

const SIMPLE_PAGE = 'data:text/html,<h1>Hello, spot-the-diff</h1>';

describe('captureScreenshot', () => {
  it('captures a PNG at the requested viewport size', async () => {
    const screenshot = await captureScreenshot({
      url: SIMPLE_PAGE,
      viewport: { width: 390, height: 844 },
    });

    const image = PNG.sync.read(screenshot);
    expect(image.width).toBe(390);
    expect(image.height).toBe(844);
  }, 30_000);
});