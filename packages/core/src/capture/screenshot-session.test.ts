import { PNG } from 'pngjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { compareScreenshots } from '../compare/compare-screenshots.ts';
import { openScreenshotSession, type ScreenshotSession } from './screenshot-session.ts';

const htmlPage = (body: string): string => `data:text/html,<body style="margin:0">${body}</body>`;
const viewport = { width: 200, height: 100 };

describe('ScreenshotSession', () => {
  let session: ScreenshotSession;

  beforeAll(async () => {
    session = await openScreenshotSession();
  }, 30_000);

  afterAll(async () => {
    await session.close();
  });

  it('captures a PNG at the requested viewport size', async () => {
    const screenshot = await session.capture({ url: htmlPage('<h1>Hello</h1>'), viewport: { width: 390, height: 844 } });

    const image = PNG.sync.read(screenshot);
    expect(image.width).toBe(390);
    expect(image.height).toBe(844);
  });

  it('hides masked areas so their content never counts as a change', async () => {
    const withTimestamp = (time: string): string => htmlPage(`<p>Balance</p><span id="updated-at">${time}</span>`);

    const before = await session.capture({ url: withTimestamp('10:00'), viewport, mask: ['#updated-at'] });
    const after = await session.capture({ url: withTimestamp('10:05'), viewport, mask: ['#updated-at'] });

    expect(compareScreenshots(before, after).changedPixels).toBe(0);
  });

  it('waits for the selector before taking the screenshot', async () => {
    const lateBanner = htmlPage(
      `<script>setTimeout(() => document.body.innerHTML = '<div id="banner" style="width:200px;height:100px;background:black"></div>', 300)</script>`,
    );

    const screenshot = await session.capture({ url: lateBanner, viewport, waitFor: '#banner' });

    const image = PNG.sync.read(screenshot);
    const firstPixelRed = image.data[0];
    expect(firstPixelRed).toBe(0);
  });
});