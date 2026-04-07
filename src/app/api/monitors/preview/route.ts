import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import { isSafeUrl } from '@/lib/validate-url';
import {
  validateSelector,
  previewSelector,
} from '@/modules/monitoring/lib/selector-validator';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { url, selector } = await request.json();

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'URL required' }, { status: 400 });
  }
  if (!selector || typeof selector !== 'string') {
    return NextResponse.json({ error: 'Selector required' }, { status: 400 });
  }
  if (!isSafeUrl(url)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
  }

  // Fetch the page
  let html: string;
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

  // Validate & preview
  const validation = validateSelector(selector, html);
  const preview = validation.valid
    ? previewSelector(html, selector)
    : { matchCount: 0, extractedText: '' };

  return NextResponse.json({
    data: {
      selectorValid: validation.valid,
      robustness: validation.robustness,
      warnings: validation.warnings,
      suggestion: validation.suggestion,
      matchCount: preview.matchCount,
      extractedText: preview.extractedText,
    },
  });
}
