import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import { isSafeUrl } from '@/lib/validate-url';
import { rateLimit } from '@/lib/rate-limit';
import { uploadToR2 } from '@/lib/r2';

/**
 * POST /api/monitors/pick
 *
 * Powers the visual element picker on the monitor creation form. The legacy
 * iframe-based picker (proxy/route.ts) breaks on JS-rendered SPAs because the
 * iframe sandbox can't execute the same JS that real Chromium does. This
 * endpoint fixes that by using Browserless on the VPS to:
 *
 *   1. Render the page in a real Chromium instance
 *   2. Take a screenshot
 *   3. Walk the DOM extracting bounding boxes + auto-generated CSS selectors
 *      for content-bearing elements
 *
 * The client then displays the screenshot as a static image and maps click
 * coordinates back to elements via the bounding boxes.
 *
 * Returns:
 *   { screenshotUrl, imageSize: {width,height}, elements: [{selector, x, y, w, h, text}] }
 *
 * Selector generation uses a tiered strategy: ID, then unique data-attribute,
 * then `tag:nth-of-type(n) > tag:nth-of-type(n) > ...` chain. The chain has a
 * depth cap so deeply-nested elements still get a usable selector.
 */

const VIEWPORT = { width: 1280, height: 800 };

// Self-contained Puppeteer function executed by Browserless's /chrome/function
// endpoint. Must be ES module syntax. The body runs INSIDE Chromium so do not
// reference anything from the outer Node closure.
//
// Important: Browserless v2's /chrome/function exposes a Puppeteer page, not
// Playwright, so it's `page.setViewport`, not `page.setViewportSize`.
//
// Screenshot format is PNG. We tried JPEG for size reasons but the resulting
// files were corrupted in the R2 pipeline (onboarding PNGs from
// /chrome/screenshot loaded fine, but JPEGs from /chrome/function did not)
// even though the JSON response parsed cleanly. Likely a base64-round-trip
// bug in Browserless's JPEG path or a Puppeteer/Chromium clip+jpeg quirk.
// PNG via the same endpoint works. We cap the capture height so even large
// pages produce manageable files.
const MAX_CAPTURE_HEIGHT = 6000;
const BROWSERLESS_FUNCTION = `
export default async function ({ page, context }) {
  await page.setViewport({ width: ${VIEWPORT.width}, height: ${VIEWPORT.height} });
  await page.goto(context.url, { waitUntil: 'networkidle2', timeout: 25000 });

  // Pin scroll to top so getBoundingClientRect returns document-absolute
  // coordinates (at scrollY=0, rect.top IS the document-relative Y).
  await page.evaluate(() => window.scrollTo(0, 0));

  const docHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const captureHeight = Math.min(docHeight, ${MAX_CAPTURE_HEIGHT});

  // PNG with clip keeps payload bounded on long pages while staying on the
  // proven-good format path.
  const screenshotBuffer = await page.screenshot({
    type: 'png',
    clip: { x: 0, y: 0, width: ${VIEWPORT.width}, height: captureHeight },
  });
  const screenshot = screenshotBuffer.toString('base64');

  // Element extraction filters to elements visible inside the captured area
  // (anything past captureHeight wasn't screenshotted, so users can't click it).
  const elements = await page.evaluate((maxY) => {
    function escapeAttr(v) {
      return String(v).replace(/\\\\/g, '\\\\\\\\').replace(/"/g, '\\\\"');
    }

    function generateSelector(el) {
      // 1. ID: only if it's a valid CSS identifier and unique
      if (el.id && /^[a-zA-Z_][\\w-]*$/.test(el.id)) {
        try {
          if (document.querySelectorAll('#' + el.id).length === 1) return '#' + el.id;
        } catch {}
      }
      // 2. Unique data-* attribute
      for (const attr of Array.from(el.attributes || [])) {
        if (attr.name.startsWith('data-') && attr.value) {
          const sel = '[' + attr.name + '="' + escapeAttr(attr.value) + '"]';
          try {
            if (document.querySelectorAll(sel).length === 1) return sel;
          } catch {}
        }
      }
      // 3. nth-of-type chain, capped at 6 levels deep
      const parts = [];
      let node = el;
      while (node && node.nodeType === 1 && parts.length < 6) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'html' || tag === 'body') break;
        const parent = node.parentElement;
        if (!parent) {
          parts.unshift(tag);
          break;
        }
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
    const out = [];
    for (const el of candidates) {
      const rect = el.getBoundingClientRect();
      if (rect.width < 16 || rect.height < 12) continue;
      // Only include elements visible inside the captured screenshot area
      if (rect.bottom < 0 || rect.top > maxY) continue;
      if (rect.right < 0 || rect.left > ${VIEWPORT.width}) continue;

      const style = getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) < 0.1) continue;

      const selector = generateSelector(el);
      if (!selector || seen.has(selector)) continue;
      seen.add(selector);

      const text = (el.textContent || '').replace(/\\s+/g, ' ').trim().slice(0, 80);

      out.push({
        selector,
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        text,
      });

      if (out.length >= 400) break;
    }
    return out;
  }, captureHeight);

  return { screenshot, elements, imageHeight: captureHeight };
}
`;

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
    const endpoint = `${browserlessUrl}/chrome/function?token=${browserlessToken}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: BROWSERLESS_FUNCTION,
        context: { url },
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Browserless ${res.status}: ${res.statusText} ${detail}`.trim());
    }

    const payload = (await res.json()) as {
      screenshot?: string;
      elements?: Array<{ selector: string; x: number; y: number; w: number; h: number; text: string }>;
      imageHeight?: number;
    };

    if (!payload.screenshot || !Array.isArray(payload.elements) || typeof payload.imageHeight !== 'number') {
      throw new Error('Browserless function returned an unexpected payload');
    }

    const screenshotBytes = Buffer.from(payload.screenshot, 'base64');
    // Sanity check: a real screenshot is at least a few KB. If we decoded
    // something much smaller, the response was likely truncated mid-stream
    // and we'd be uploading garbage bytes to R2. Fail loudly instead of
    // silently producing a broken image.
    if (screenshotBytes.length < 2048) {
      throw new Error(
        `Screenshot decoded to only ${screenshotBytes.length} bytes — likely truncated by the Browserless response pipeline`,
      );
    }
    const key = `previews/${createId()}.png`;
    const screenshotUrl = await uploadToR2(key, screenshotBytes, 'image/png');

    return NextResponse.json({
      data: {
        screenshotUrl,
        // imageSize describes the actual JPEG dimensions the client should
        // scale clicks against. Width is the fixed viewport width; height is
        // the clipped capture height (min of document height and the cap).
        imageSize: {
          width: VIEWPORT.width,
          height: payload.imageHeight,
        },
        elements: payload.elements,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[pick] failed:', message);
    return NextResponse.json(
      { error: `Couldn't load the page picker: ${message}` },
      { status: 502 },
    );
  }
}
