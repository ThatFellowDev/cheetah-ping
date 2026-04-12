import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import { createId } from '@paralleldrive/cuid2';
import { isSafeUrl } from '@/lib/validate-url';
import { rateLimit } from '@/lib/rate-limit';
import { takeScreenshot } from '@/lib/screenshot';
import { uploadToR2 } from '@/lib/r2';

/**
 * POST /api/monitors/screenshot
 *
 * Onboarding-time screenshot capture. Called in parallel with /analyze
 * from the monitor creation form so the user sees a real visual preview
 * of the page before clicking "Start monitoring."
 *
 * Returns { screenshotUrl } — a public R2 URL the form can <img src> directly.
 *
 * Failures are NOT fatal: the form should still let the user create a monitor
 * even if Browserless or R2 are temporarily down. Callers are expected to
 * handle non-200 responses gracefully.
 *
 * Key shape: `previews/<cuid>.png` — no userId embedded, since the URL is a
 * capability and we don't want a leaked preview link to expose user identity.
 */
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

  try {
    // PNG for the onboarding preview — sharper than JPEG, one-time capture,
    // file size doesn't matter much because it's a single image not a stream.
    const buffer = await takeScreenshot(url, { type: 'png' });
    const key = `previews/${createId()}.png`;
    const screenshotUrl = await uploadToR2(key, buffer, 'image/png');
    return NextResponse.json({ data: { screenshotUrl } });
  } catch (err) {
    console.error('[screenshot] failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Unable to capture a screenshot. Please try again.' },
      { status: 502 },
    );
  }
}
