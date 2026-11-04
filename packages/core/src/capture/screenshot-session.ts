import { chromium } from 'playwright';

export interface Viewport {
  width: number;
  height: number;
}

export interface ScreenshotRequest {
  url: string;
  viewport: Viewport;
  /** CSS selector that must be visible before the screenshot is taken. */
  waitFor?: string;
  /** CSS selectors of areas painted over with a solid colour, so dynamic content never shows up as a change. */
  mask?: string[];
}

export interface ScreenshotSession {
  capture(request: ScreenshotRequest): Promise<Buffer>;
  close(): Promise<void>;
}

/**
 * Starts one Chromium instance to be shared by every screenshot in a run.
 * Launching a browser takes about a second, so reusing it keeps a run with
 * dozens of routes fast. Each capture still gets its own browser context,
 * which keeps cookies and storage from leaking between routes.
 */
export async function openScreenshotSession(): Promise<ScreenshotSession> {
  const browser = await chromium.launch();

  return {
    async capture(request: ScreenshotRequest): Promise<Buffer> {
      const context = await browser.newContext({ viewport: request.viewport });

      try {
        const page = await context.newPage();
        await page.goto(request.url, { waitUntil: 'load' });
        if (request.waitFor) await page.locator(request.waitFor).waitFor();
        await page.evaluate(() => document.fonts.ready);

        return await page.screenshot({
          fullPage: true,
          animations: 'disabled',
          caret: 'hide',
          mask: (request.mask ?? []).map((selector) => page.locator(selector)),
        });
      } finally {
        await context.close();
      }
    },

    async close(): Promise<void> {
      await browser.close();
    },
  };
}