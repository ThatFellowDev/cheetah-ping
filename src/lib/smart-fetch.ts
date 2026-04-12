/**
 * Smart fetch with Browserless fallback for JS-rendered pages.
 *
 * Tries plain fetch() first (free, fast). If the response looks like an empty
 * JS shell (React/Next/Vue SPA before hydration), falls back to Browserless
 * via Cloudflare Tunnel which renders the page in real Chromium.
 *
 * Most pages stay free. Only ~30% of sites that need JS rendering pay the
 * VPS round-trip cost.
 */

export function looksLikeJsShell(html: string): boolean {
  const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (text.length < 500) return true;
  if (/<div[^>]*id=["'](root|__next|app|__nuxt)["'][^>]*>\s*<\/div>/i.test(html)) return true;
  return false;
}

async function browserlessFetch(url: string, browserlessUrl: string, browserlessToken: string): Promise<string> {
  const endpoint = `${browserlessUrl}/chrome/content?token=${browserlessToken}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      gotoOptions: { waitUntil: 'networkidle2', timeout: 20_000 },
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Browserless ${res.status}: ${res.statusText}`);
  return await res.text();
}

export async function smartFetch(url: string): Promise<string> {
  // SSRF check: validate URL before any fetch (including Browserless fallback)
  const { isSafeUrl } = await import('./validate-url');
  if (!isSafeUrl(url)) {
    throw new Error('URL not allowed: blocked by SSRF protection');
  }

  const browserlessUrl = process.env.BROWSERLESS_URL;
  const browserlessToken = process.env.BROWSERLESS_TOKEN;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CheetahPing/1.0 (https://cheetahping.com)' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const html = await res.text();

    if (looksLikeJsShell(html) && browserlessUrl && browserlessToken) {
      console.log(`[FALLBACK] ${url} looks JS-rendered, using Browserless`);
      return await browserlessFetch(url, browserlessUrl, browserlessToken);
    }
    return html;
  } catch (err) {
    if (browserlessUrl && browserlessToken) {
      console.log(`[FALLBACK] ${url} fetch failed, using Browserless`);
      return await browserlessFetch(url, browserlessUrl, browserlessToken);
    }
    throw err;
  }
}
