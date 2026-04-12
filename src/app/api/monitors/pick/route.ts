import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import { isSafeUrl } from '@/lib/validate-url';
import { rateLimit } from '@/lib/rate-limit';
import { uploadToR2 } from '@/lib/r2';
import { takeScreenshot } from '@/lib/screenshot';

/**
 * POST /api/monitors/pick
 *
 * Powers the visual element picker on the monitor creation form.
 *
 * Architecture: two parallel Browserless calls, each using a different endpoint
 * that's proven to work independently:
 *
 *   1. /chrome/screenshot (via takeScreenshot) for the image. This returns raw
 *      binary bytes. Proven working by the onboarding preview endpoint.
 *
 *   2. /chrome/function for element extraction only. This returns a small JSON
 *      payload with bounding boxes + auto-generated CSS selectors. No screenshot
 *      bytes, no base64 encoding.
 *
 * We deliberately DO NOT take the screenshot inside /chrome/function. Prior
 * iterations tried that (encoding the screenshot as base64 inside the function
 * return value), and the base64 was consistently corrupted after the
 * Browserless JSON serialization round-trip, producing valid-looking URLs in R2
 * that served garbage bytes. Both JPEG and PNG were affected. The corruption
 * was confirmed by opening the R2 URL directly in a browser: the file existed
 * but displayed a broken image icon.
 *
 * Returns:
 *   { screenshotUrl, imageSize: {width,height}, elements: [{selector, x, y, w, h, text}] }
 */

const VIEWPORT = { width: 1280, height: 800 };

// Puppeteer function for element extraction ONLY. No screenshot, no base64.
// Small JSON response. Runs on Browserless /chrome/function.
const ELEMENT_EXTRACTION_FUNCTION = `
export default async function ({ page, context }) {
  await page.setViewport({ width: ${VIEWPORT.width}, height: ${VIEWPORT.height} });
  // Force English locale so sites don't serve Finnish content based on
  // the Hetzner Helsinki VPS geo-IP.
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
  await page.goto(context.url, { waitUntil: 'networkidle2', timeout: 25000 });

  // Scroll through the page in steps to trigger intersection-observer and
  // lazy-loaded content. The screenshot endpoint (fullPage:true) does this
  // internally for pixel capture, but /chrome/function doesn't, so elements
  // below the fold won't be in the DOM unless we force them to load.
  const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = 800;
  for (let y = 0; y < scrollHeight; y += step) {
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    // Brief pause lets intersection observers fire and content render
    await new Promise(r => setTimeout(r, 150));
  }
  // Scroll back to top and wait for any final renders
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(r => setTimeout(r, 300));

  return await page.evaluate(() => {
    const documentHeight = document.documentElement.scrollHeight;

    function escapeAttr(v) {
      return String(v).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
    }

    function generateSelector(el) {
      if (el.id && /^[a-zA-Z_][\\w-]*$/.test(el.id)) {
        try {
          if (document.querySelectorAll('#' + el.id).length === 1) return '#' + el.id;
        } catch {}
      }
      for (const attr of Array.from(el.attributes || [])) {
        if (attr.name.startsWith('data-') && attr.value) {
          const sel = '[' + attr.name + '="' + escapeAttr(attr.value) + '"]';
          try {
            if (document.querySelectorAll(sel).length === 1) return sel;
          } catch {}
        }
      }
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && parts.length < 6) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'html' || tag === 'body') break;
        const parent = node.parentElement;
        if (!parent) { parts.unshift(tag); break; }
        const siblings = Array.from(parent.children).filter((c) => c.tagName === node.tagName);
        if (siblings.length === 1) {
          parts.unshift(tag);
        } else {
          parts.unshift(tag + ':nth-of-type(' + (siblings.indexOf(node) + 1) + ')');
        }
        node = parent;
      }
      return parts.join(' > ');
    }

    const SELECTORS = 'h1, h2, h3, h4, h5, p, button, a, article, section, [data-price], [data-product], [data-job], [role="button"], li, td, span, img';
    const candidates = Array.from(document.querySelectorAll(SELECTORS));

    const seen = new Set();
    const elements = [];
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 12) continue;
      if (rect.bottom < 0 || rect.top > documentHeight) continue;
      if (rect.right < 0 || rect.left > ${VIEWPORT.width}) continue;

      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) continue;

      const selector = generateSelector(el);
      if (!selector || seen.has(selector)) continue;
      seen.add(selector);

      const text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);

      elements.push({
        selector,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        text,
      });

      if (elements.length >= 400) break;
    }
    return { elements, documentHeight };
  });
}
`;

/**
 * Parse width + height from a PNG file's IHDR chunk (bytes 16-23).
 * Falls back to the viewport dimensions if the buffer is too short
 * (shouldn't happen for valid PNGs, but belt-and-suspenders).
 */
function pngDimensions(buf: Buffer): { width: number; height: number } {
  if (buf.length >= 24) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    };
  }
  return VIEWPORT;
}

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) return rateLimited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let url: string;
  try {
    const body = await request.json();
    url = body.url;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  if (!isSafeUrl(url)) {
    return NextResponse.json(
      { error: 'URLs to private or internal networks are not allowed' },
      { status: 400 },
    );
  }

  const browserlessUrl = process.env.BROWSERLESS_URL;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;
  if (!browserlessUrl || !browserlessToken) {
    return NextResponse.json(
      { error: 'Element picker is not configured (BROWSERLESS_URL/TOKEN missing)' },
      { status: 503 },
    );
  }

  try {
    // Fire both Browserless calls in parallel. They each navigate to the URL
    // independently, but both use the same VPS Chromium instance. Total time
    // ≈ max(screenshot, extraction) instead of the sum.
    const [screenshotBuffer, extractionResult] = await Promise.all([
      // 1. Screenshot via /chrome/screenshot (proven working — same path as
      //    the onboarding preview endpoint). Returns raw PNG bytes directly,
      //    no base64-in-JSON corruption risk.
      takeScreenshot(url, { type: 'png', fullPage: true }),

      // 2. Element extraction via /chrome/function (small JSON response).
      (async () => {
        const endpoint = `${browserlessUrl}/chrome/function?token=${browserlessToken}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: ELEMENT_EXTRACTION_FUNCTION,
            context: { url },
          }),
          signal: AbortSignal.timeout(45_000),
        });

        if (!res.ok) {
          const detail = await res.text().catch(() => '');
          throw new Error(`Browserless ${res.status}: ${res.statusText} ${detail}`.trim());
        }

        return (await res.json()) as {
          elements?: Array<{ selector: string; x: number; y: number; w: number; h: number; text: string }>;
          documentHeight?: number;
        };
      })(),
    ]);

    if (!Array.isArray(extractionResult.elements)) {
      throw new Error('Element extraction returned an unexpected payload');
    }

    const key = `previews/${createId()}.png`;
    const screenshotUrl = await uploadToR2(key, screenshotBuffer, 'image/png');
    const imageSize = pngDimensions(screenshotBuffer);

    return NextResponse.json({
      data: {
        screenshotUrl,
        imageSize,
        elements: extractionResult.elements,
      },
    });
  } catch (err) {
    console.error('[pick] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Unable to load the page picker. Please try again.' },
      { status: 502 },
    );
  }
}
