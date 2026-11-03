import { chromium } from 'playwright';

export interface Viewport {
  width: number;
  height: number;
}

export interface CaptureOptions {
  url: string;
  viewport: Viewport;
}

/**
 * Opens a page in a fresh Chromium instance and returns a full-page PNG.
 * Animations, the text caret and font loading are neutralised because each
 * of them produces pixel differences that are not real visual changes.
 */
export async function captureScreenshot(options: CaptureOptions): Promise<Buffer> {
  const browser = await chromium.launch();

  try {
    const page = await browser.newPage({ viewport: options.viewport });
    await page.goto(options.url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);

    return await page.screenshot({
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
    });
  } finally {
    await browser.close();
  }
}