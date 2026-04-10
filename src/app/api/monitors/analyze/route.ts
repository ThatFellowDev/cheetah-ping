import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { isSafeUrl } from '@/lib/validate-url';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) return rateLimited;

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, intent } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: 'URLs to private or internal networks are not allowed' }, { status: 400 });
  }

  // Fetch the page
  let html: string;
  let pageTitle = '';
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { 'User-Agent': 'CheetahPing/1.0' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    return NextResponse.json(
      { error: `Couldn't reach that page: ${err instanceof Error ? err.message : 'Unknown error'}` },
      { status: 400 }
    );
  }

  // Extract page info with Cheerio
  const $ = cheerio.load(html);
  $('script, style, noscript, iframe, svg').remove();
  pageTitle = $('title').text().trim() || $('h1').first().text().trim() || '';
  const metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';
  const ogImage = $('meta[property="og:image"]').attr('content')?.trim() || '';
  const favicon = $('link[rel="icon"], link[rel="shortcut icon"]').attr('href') || '';
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 3000);
  const pageSnippet = bodyText.slice(0, 200);

  // Extract DOM structure hints for better AI selector suggestions
  const domHints: string[] = [];
  $('[id]').each((_, el) => {
    const tag = (el as any).tagName;
    const id = $(el).attr('id');
    if (id && !/^[\d]/.test(id)) domHints.push(`${tag}#${id}`);
  });
  $('[data-price], [data-product], [data-listing], [data-job]').each((_, el) => {
    const tag = (el as any).tagName;
    const attrs = Object.keys((el as any).attribs || {})
      .filter((a: string) => a.startsWith('data-'))
      .map((a: string) => `[${a}]`)
      .join('');
    domHints.push(`${tag}${attrs}`);
  });
  const domSummary = domHints.slice(0, 30).join(', ');

  // Resolve favicon URL
  let faviconUrl = '';
  if (favicon) {
    try {
      faviconUrl = new URL(favicon, url).href;
    } catch {
      faviconUrl = '';
    }
  }
  if (!faviconUrl) {
    try {
      faviconUrl = new URL('/favicon.ico', url).href;
    } catch {
      faviconUrl = '';
    }
  }

  const pagePreview = {
    title: pageTitle.slice(0, 120),
    description: metaDescription.slice(0, 200) || pageSnippet,
    favicon: faviconUrl,
    ogImage,
  };

  // Extract content preview for what would be monitored
  function getContentPreview(selectorStr?: string | null): string {
    if (selectorStr) {
      const el = $(selectorStr);
      if (el.length > 0) {
        return el.text().replace(/\s+/g, ' ').trim().slice(0, 300);
      }
    }
    return bodyText.slice(0, 300);
  }

  // If no Groq key, return basic analysis
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({
      data: {
        label: pageTitle.slice(0, 80) || new URL(url).hostname,
        watchMode: 'page',
        keyword: null,
        selector: null,
        summary: `We'll watch this page for any changes.`,
        intentSummary: `We'll watch this page and alert you when anything changes.`,
        alertExplanation: `You'll be notified when the visible content on this page changes. Minor formatting changes and timestamps are automatically filtered out.`,
        suggestedFrequencyMinutes: 1440,
        confidence: 'basic',
        selectorSuggestions: [],
        pagePreview,
        contentPreview: getContentPreview(null),
      },
    });
  }

  // AI analysis with Groq
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: `You analyze webpages and suggest monitoring strategies. Given a URL, page content, DOM structure hints, and optionally the user's intent (what they want to watch for), determine:
1. A short label for this monitor (max 60 chars)
2. The best watch mode: "page" (whole page), "keyword" (watch for specific word), or "selector" (watch specific element)
3. If keyword mode: suggest the keyword to watch for
4. If selector mode: suggest a CSS selector (prefer IDs and data-attributes over deep chains)
5. "summary": a one-sentence technical explanation
6. "intentSummary": a consumer-friendly sentence like "We'll watch the product price and ping you when it drops" — speak directly to the user, be specific about what you'll monitor
7. "alertExplanation": explain what WILL and WON'T trigger an alert, e.g. "You'll be notified when the price changes. Minor text updates elsewhere on the page won't trigger alerts because we're only watching the price element."
8. "suggestedFrequencyMinutes": recommend a check frequency based on the use case (5 for prices/stock, 15 for job boards, 60 for news/blogs, 1440 for policy/legal pages)
9. Always provide 2-4 selectorSuggestions — different CSS selectors the user might want to monitor. Each has: selector (CSS), label (short human name), rationale (one sentence why), robustness ("high" if uses ID/data-attr, "medium" if class-based, "low" if positional/deep chain).

If the user provides intent, heavily weight your suggestions toward fulfilling that intent.

Respond in JSON only:
{"label":"...","watchMode":"page|keyword|selector","keyword":null,"selector":null,"summary":"...","intentSummary":"...","alertExplanation":"...","suggestedFrequencyMinutes":60,"selectorSuggestions":[{"selector":"...","label":"...","rationale":"...","robustness":"high|medium|low"}]}`,
      },
      {
        role: 'user',
        content: `URL: ${url}\nPage title: ${pageTitle}\n${intent ? `User intent: ${intent}\n` : ''}DOM hints: ${domSummary || 'none'}\nPage content (first 3000 chars):\n${bodyText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: 'json_object' },
  });

  try {
    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    return NextResponse.json({
      data: {
        label: result.label || pageTitle.slice(0, 80) || new URL(url).hostname,
        watchMode: result.watchMode || 'page',
        keyword: result.keyword || null,
        selector: result.selector || null,
        summary: result.summary || "We'll watch this page for changes.",
        intentSummary: result.intentSummary || result.summary || "We'll watch this page and alert you when it changes.",
        alertExplanation: result.alertExplanation || "You'll be notified when the visible content changes. Timestamps and minor formatting changes are automatically filtered out.",
        suggestedFrequencyMinutes: result.suggestedFrequencyMinutes || 60,
        confidence: 'ai',
        selectorSuggestions: Array.isArray(result.selectorSuggestions)
          ? result.selectorSuggestions.slice(0, 5)
          : [],
        pagePreview,
        contentPreview: getContentPreview(result.selector),
      },
    });
  } catch {
    return NextResponse.json({
      data: {
        label: pageTitle.slice(0, 80) || new URL(url).hostname,
        watchMode: 'page',
        keyword: null,
        selector: null,
        summary: "We'll watch this page for any changes.",
        intentSummary: "We'll watch this page and alert you when anything changes.",
        alertExplanation: "You'll be notified when the visible content changes. Timestamps and minor formatting changes are automatically filtered out.",
        suggestedFrequencyMinutes: 1440,
        confidence: 'basic',
        selectorSuggestions: [],
        pagePreview,
        contentPreview: getContentPreview(null),
      },
    });
  }
}
