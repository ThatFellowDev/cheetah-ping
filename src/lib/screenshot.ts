/**
 * Server-side screenshot capture via Browserless on the Hetzner VPS.
 *
 * Calls /chrome/screenshot through the Cloudflare Tunnel
 * (browser.cheetahping.com → 127.0.0.1:3000 inside the VPS).
 *
 * Returns the raw image bytes as a Buffer, ready to upload to R2.
 *
 * Cookie/consent banners are auto-dismissed via injected JS + CSS.
 *
 * Mirrors the smart-fetch.ts pattern: Browserless creds come from env vars,
 * timeouts are aggressive enough to fail fast in serverless environments.
 */

import { COOKIE_DISMISS_JS, COOKIE_HIDE_CSS } from './dismiss-cookies';

export type ScreenshotOpts = {
  /** Image format. JPEG = small, good for snapshots. PNG = sharp, good for previews. */
  type?: 'jpeg' | 'png';
  /** JPEG quality 0-100. Ignored for PNG. */
  quality?: number;
  /** Full page screenshot vs. viewport only. Default: viewport. */
  fullPage?: boolean;
  /** Viewport size. Default: 1280×800 desktop. */
  viewport?: { width: number; height: number };
};

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

export async function takeScreenshot(url: string, opts: ScreenshotOpts = {}): Promise<Buffer> {
  const browserlessUrl = process.env.BROWSERLESS_URL;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessUrl || !browserlessToken) {
    throw new Error('BROWSERLESS_URL and BROWSERLESS_TOKEN must be set to take screenshots');
  }

  const type = opts.type ?? 'jpeg';
  const body: Record<string, unknown> = {
    url,
    options: {
      type,
      fullPage: opts.fullPage ?? false,
      ...(type === 'jpeg' ? { quality: opts.quality ?? 80 } : {}),
    },
    viewport: opts.viewport ?? DEFAULT_VIEWPORT,
    gotoOptions: { waitUntil: 'networkidle2', timeout: 20_000 },
    // Force English locale so sites don't serve Finnish content based on
    // the Hetzner Helsinki VPS geo-IP.
    setExtraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
    // Dismiss cookie/consent banners before capturing the screenshot.
    addScriptTag: [{ content: COOKIE_DISMISS_JS }],
    addStyleTag: [{ content: COOKIE_HIDE_CSS }],
    waitForTimeout: 800,
  };

  const endpoint = `${browserlessUrl}/chrome/screenshot?token=${browserlessToken}&stealth&blockAds`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Browserless screenshot ${res.status}: ${res.statusText} ${detail}`.trim());
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
