import { NextRequest } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import * as cheerio from 'cheerio';
import { isSafeUrl } from '@/lib/validate-url';
import { smartFetch } from '@/lib/smart-fetch';
import { PICKER_SCRIPT } from './picker-script';

const MAX_HTML_SIZE = 8 * 1024 * 1024; // 8MB — modern SPAs ship a lot of HTML

function resolveUrl(relative: string, base: string): string {
  try {
    return new URL(relative.trim(), base).href;
  } catch {
    return relative;
  }
}

function rewriteStyleUrls(css: string, baseUrl: string): string {
  return css.replace(
    /url\((['"]?)([^)'"]+)\1\)/g,
    (_match, quote, path) => `url(${quote}${resolveUrl(path.trim(), baseUrl)}${quote})`
  );
}

function errorPage(message: string): string {
  return `<!DOCTYPE html><html><head><style>
    body { background: #1a1a1a; color: #a0a0a0; font-family: -apple-system, sans-serif;
           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .msg { text-align: center; }
    h2 { color: #f59e0b; font-size: 18px; margin-bottom: 8px; }
    p { font-size: 14px; }
  </style></head><body><div class="msg"><h2>Could not load page</h2><p>${message}</p></div></body></html>`;
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return new Response(errorPage('Unauthorized'), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return new Response(errorPage('No URL provided'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (!isSafeUrl(url)) {
    return new Response(errorPage('URL not allowed'), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Fetch the page — uses Browserless fallback for JS-rendered sites
  let html: string;
  try {
    html = await smartFetch(url);

    if (html.length > MAX_HTML_SIZE) {
      return new Response(errorPage('Page is too large to preview'), {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
  } catch (err) {
    return new Response(
      errorPage(`Couldn't reach the page: ${err instanceof Error ? err.message : 'Unknown error'}`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Determine base URL for resolving relative paths
  let baseUrl = url;
  const $ = cheerio.load(html);
  const baseTag = $('base[href]').attr('href');
  if (baseTag) {
    try {
      baseUrl = new URL(baseTag, url).href;
    } catch { /* keep original */ }
  }

  // Remove dangerous elements
  $('script, object, embed, applet').remove();
  $('meta[http-equiv="refresh"]').remove();

  // Rewrite asset URLs to absolute
  $('link[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (href) $(el).attr('href', resolveUrl(href, baseUrl));
  });

  $('img[src], source[src], video[src], audio[src], input[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (src) $(el).attr('src', resolveUrl(src, baseUrl));
  });

  // Force eager loading on all images (disable lazy loading since there's no JS observer)
  $('img[loading="lazy"], source[loading="lazy"]').attr('loading', 'eager');
  $('img').removeAttr('loading');

  // Promote ALL common lazy-loading data attributes to src/srcset
  const lazySrcAttrs = ['data-src', 'data-original', 'data-lazy-src', 'data-image', 'data-lazy', 'data-url'];
  const lazySrcsetAttrs = ['data-srcset', 'data-lazy-srcset'];

  $('img, source').each((_, el) => {
    const $el = $(el);
    // Try each lazy-src attribute
    if (!$el.attr('src') || $el.attr('src')?.includes('data:image') || $el.attr('src')?.includes('placeholder') || $el.attr('src')?.includes('blank')) {
      for (const attr of lazySrcAttrs) {
        const val = $el.attr(attr);
        if (val && val.startsWith('http')) {
          $el.attr('src', resolveUrl(val, baseUrl));
          break;
        }
      }
    }
    // Also promote even if src exists (some sites set src to a tiny placeholder)
    for (const attr of lazySrcAttrs) {
      const val = $el.attr(attr);
      if (val && (val.startsWith('http') || val.startsWith('/'))) {
        $el.attr('src', resolveUrl(val, baseUrl));
        break;
      }
    }
    // Promote lazy srcset
    for (const attr of lazySrcsetAttrs) {
      const val = $el.attr(attr);
      if (val) {
        $el.attr('srcset', val);
        break;
      }
    }
  });

  // Handle background-image in data attributes (data-bg, data-background)
  $('[data-bg], [data-background], [data-background-image]').each((_, el) => {
    const bg = $(el).attr('data-bg') || $(el).attr('data-background') || $(el).attr('data-background-image');
    if (bg) {
      const currentStyle = $(el).attr('style') || '';
      $(el).attr('style', `${currentStyle}; background-image: url(${resolveUrl(bg, baseUrl)}) !important;`);
    }
  });

  // Unhide noscript content (sites often include fallback images inside noscript)
  $('noscript').each((_, el) => {
    const content = $(el).html();
    if (content && (content.includes('<img') || content.includes('<picture'))) {
      $(el).replaceWith(content);
    }
  });

  // Rewrite srcset
  $('[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      const rewritten = srcset
        .split(',')
        .map((entry) => {
          const parts = entry.trim().split(/\s+/);
          if (parts[0]) parts[0] = resolveUrl(parts[0], baseUrl);
          return parts.join(' ');
        })
        .join(', ');
      $(el).attr('srcset', rewritten);
    }
  });

  // Rewrite url() in <style> tags
  $('style').each((_, el) => {
    const content = $(el).html();
    if (content) $(el).html(rewriteStyleUrls(content, baseUrl));
  });

  // Rewrite inline style attributes
  $('[style]').each((_, el) => {
    const style = $(el).attr('style');
    if (style && style.includes('url(')) {
      $(el).attr('style', rewriteStyleUrls(style, baseUrl));
    }
  });

  // Neutralize links and forms
  $('a').attr('onclick', 'return false').removeAttr('target');
  $('form').attr('action', 'javascript:void(0)').attr('onsubmit', 'return false');

  // Check if page has meaningful content after script removal
  // (SPA pages will be mostly empty)
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  if (bodyText.length < 50) {
    // Inject a helpful notice for JS-dependent pages
    $('body').prepend(`
      <div style="background:#451a03;color:#fbbf24;padding:12px 16px;font-family:-apple-system,sans-serif;font-size:13px;text-align:center;border-bottom:1px solid rgba(251,191,36,0.2);">
        This page requires JavaScript to render its content. The preview may appear empty, but you can still use the AI-suggested selectors or enter one manually.
      </div>
    `);
  }

  // Inject styles to force-show lazy-loaded images and hidden content
  $('head').append(`<style>
    img { opacity: 1 !important; visibility: visible !important; }
    [data-src], [data-lazy], [data-original] { opacity: 1 !important; visibility: visible !important; }
  </style>`);

  // Inject picker script at end of body
  $('body').append(PICKER_SCRIPT);

  const resultHtml = $.html();

  return new Response(resultHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  });
}
