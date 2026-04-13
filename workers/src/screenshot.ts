/**
 * Worker-side screenshot capture via Browserless on the Hetzner VPS.
 *
 * Mirrors src/lib/screenshot.ts but takes env as a parameter
 * (Workers don't have process.env — env vars come through the fetch handler).
 *
 * Returns ArrayBuffer because that's what env.SCREENSHOTS.put() accepts directly.
 */

import { COOKIE_DISMISS_JS, COOKIE_HIDE_CSS } from './dismiss-cookies';

export interface ScreenshotEnv {
  BROWSERLESS_URL?: string;
  BROWSERLESS_TOKEN?: string;
}

export type ScreenshotOpts = {
  type?: 'jpeg' | 'png';
  quality?: number;
  fullPage?: boolean;
  viewport?: { width: number; height: number };
};

const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

export async function takeScreenshot(
  url: string,
  env: ScreenshotEnv,
  opts: ScreenshotOpts = {},
): Promise<ArrayBuffer> {
  if (!env.BROWSERLESS_URL || !env.BROWSERLESS_TOKEN) {
    throw new Error('BROWSERLESS_URL and BROWSERLESS_TOKEN must be set on the Worker to take screenshots');
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
    // Layer 1: JS clicks common "Accept" buttons in known cookie containers.
    // Layer 2: CSS hides any remaining banners as a fallback.
    addScriptTag: [{ content: COOKIE_DISMISS_JS }],
    addStyleTag: [{ content: COOKIE_HIDE_CSS }],
    waitForTimeout: 800,
  };

  const endpoint = `${env.BROWSERLESS_URL}/chrome/screenshot?token=${env.BROWSERLESS_TOKEN}&stealth&blockAds`;
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

  return await res.arrayBuffer();
}

/**
 * Returns the JPEG content type for the given screenshot opts.
 * Useful when calling env.SCREENSHOTS.put(key, buf, { httpMetadata: { contentType } }).
 */
export function screenshotContentType(opts: ScreenshotOpts = {}): string {
  return (opts.type ?? 'jpeg') === 'png' ? 'image/png' : 'image/jpeg';
}
