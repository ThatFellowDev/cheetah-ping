import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import * as cheerio from 'cheerio';
import Groq from 'groq-sdk';
import { isSafeUrl } from '@/lib/validate-url';
import { rateLimit } from '@/lib/rate-limit';
import { smartFetch } from '@/lib/smart-fetch';
import { FREQUENCY_OPTIONS } from '@/lib/plan-limits';

const VALID_WATCH_MODES = ['page', 'keyword', 'selector'] as const;
type WatchMode = (typeof VALID_WATCH_MODES)[number];

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-user rate limiting (5 AI analyses per minute)
  const rateLimited = await rateLimit(request, { identifier: session.user.id });
  if (rateLimited) return rateLimited;

  const { url, intent } = await request.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }

  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: 'URLs to private or internal networks are not allowed' }, { status: 400 });
  }

  // Fetch the page — falls back to Browserless for JS-rendered sites
  let html: string;
  let pageTitle = '';
  try {
    html = await smartFetch(url);
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
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content: `You analyze webpages and suggest monitoring strategies. Given a URL, page content, DOM structure hints, and optionally the user's intent (what they want to watch for), determine:
1. A short label for this monitor (max 60 chars)
2. The best watch mode: "page" (whole page), "keyword" (watch for specific word), or "selector" (watch specific element)
3. If keyword mode: suggest the keyword to watch for
4. If selector mode: suggest a CSS selector (prefer IDs and data-attributes over deep chains)
5. "summary": a one-sentence technical explanation
6. "intentSummary": a consumer-friendly sentence like "We'll watch the product price and ping you when it drops". Speak directly to the user, be specific about what you'll monitor. Never use em dashes in your output. Use periods, commas, or colons instead.
7. "alertExplanation": explain what WILL and WON'T trigger an alert, e.g. "You'll be notified when the price changes. Minor text updates elsewhere on the page won't trigger alerts because we're only watching the price element."
8. "suggestedFrequencyMinutes": recommend a check frequency based on the use case. Default toward LONGER intervals when possible to conserve resources. Only recommend fast checks when the use case genuinely requires it. Guide: 5 for time-sensitive prices/stock, 15 for job boards, 60 for news/blogs, 1440 for policy/legal pages, 10080 (weekly) for reference docs, API model lists, pricing pages, and anything that changes monthly or less
9. Always provide 2-4 selectorSuggestions with CSS selectors the user might monitor. Each has: selector (CSS), label (short human name), rationale (one sentence why), robustness ("high" for ID/data-attr, "medium" for class-based, "low" for positional/deep chains). CRITICAL: only propose selectors that match the DOM hints you were given. Do not guess tag wrappers around IDs. If the hints list "h2#production-models", return exactly "h2#production-models", never "div#production-models". Invalid selectors are filtered out server-side, so guessing wastes your output tokens.

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

    // Validate every AI output against ground truth before shipping it.
    // LLMs hallucinate plausible-sounding answers and we should never trust
    // structured output blindly. Each field gets checked against the real
    // DOM, page text, or known enum. Invalid values fall back to safe defaults.

    // 1. Watch mode must be one of the known enum values.
    const rawWatchMode = typeof result.watchMode === 'string' ? result.watchMode : '';
    let watchMode: WatchMode = (VALID_WATCH_MODES as readonly string[]).includes(rawWatchMode)
      ? (rawWatchMode as WatchMode)
      : 'page';

    // 2. Primary selector: must actually match something in the fetched DOM.
    //    Same hallucination class as selectorSuggestions.
    let primarySelector: string | null = null;
    if (typeof result.selector === 'string' && result.selector.trim()) {
      try {
        if ($(result.selector).length > 0) {
          primarySelector = result.selector.trim();
        }
      } catch {
        // Malformed CSS, drop it.
      }
    }

    // 3. Primary keyword: must actually appear in the page text (case-insensitive).
    //    Otherwise the monitor would never fire.
    let primaryKeyword: string | null = null;
    if (typeof result.keyword === 'string' && result.keyword.trim()) {
      const kw = result.keyword.trim();
      if (bodyText.toLowerCase().includes(kw.toLowerCase())) {
        primaryKeyword = kw;
      }
    }

    // 4. Validate selectorSuggestions against the real DOM.
    const validatedSuggestions = Array.isArray(result.selectorSuggestions)
      ? result.selectorSuggestions
          .filter((s: { selector?: unknown }) => {
            if (!s?.selector || typeof s.selector !== 'string') return false;
            try {
              return $(s.selector).length > 0;
            } catch {
              return false;
            }
          })
          .slice(0, 5)
      : [];

    // 5. If the AI picked a watch mode but the corresponding value was
    //    invalidated, demote to 'page' so the monitor still works.
    if (watchMode === 'selector' && !primarySelector) {
      // Try to rescue by using the first valid suggestion before giving up.
      const firstValid = validatedSuggestions[0]?.selector;
      if (typeof firstValid === 'string') {
        primarySelector = firstValid;
      } else {
        watchMode = 'page';
      }
    }
    if (watchMode === 'keyword' && !primaryKeyword) {
      watchMode = 'page';
    }

    // 6. Clamp suggested frequency to the nearest known FREQUENCY_OPTIONS value.
    //    Guards against NaN, negatives, zero, and out-of-range numbers.
    const validFrequencies = FREQUENCY_OPTIONS.map((f) => f.value);
    const rawFreq = Number(result.suggestedFrequencyMinutes);
    const suggestedFrequencyMinutes =
      Number.isFinite(rawFreq) && rawFreq > 0
        ? validFrequencies.reduce((prev, curr) =>
            Math.abs(curr - rawFreq) < Math.abs(prev - rawFreq) ? curr : prev
          )
        : 1440;

    // 7. Label: trim and clamp length. Free text, low stakes.
    const rawLabel = typeof result.label === 'string' ? result.label.trim() : '';
    const label = rawLabel.slice(0, 80) || pageTitle.slice(0, 80) || new URL(url).hostname;

    // 8. Strip em dashes and en dashes from free-text AI output. LLMs love
    //    them, our writing style (AGENTS.md) bans them. Belt and suspenders
    //    alongside the prompt instruction.
    const stripDashes = (s: string) => s.replace(/[—–]/g, ', ').replace(/,\s*,/g, ',');
    const cleanSummary = typeof result.summary === 'string' ? stripDashes(result.summary) : null;
    const cleanIntent = typeof result.intentSummary === 'string' ? stripDashes(result.intentSummary) : null;
    const cleanAlert = typeof result.alertExplanation === 'string' ? stripDashes(result.alertExplanation) : null;

    return NextResponse.json({
      data: {
        label: stripDashes(label),
        watchMode,
        keyword: primaryKeyword,
        selector: primarySelector,
        summary: cleanSummary || "We'll watch this page for changes.",
        intentSummary: cleanIntent || cleanSummary || "We'll watch this page and alert you when it changes.",
        alertExplanation: cleanAlert || "You'll be notified when the visible content changes. Timestamps and minor formatting changes are automatically filtered out.",
        suggestedFrequencyMinutes,
        confidence: 'ai',
        selectorSuggestions: validatedSuggestions,
        pagePreview,
        contentPreview: getContentPreview(primarySelector),
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
