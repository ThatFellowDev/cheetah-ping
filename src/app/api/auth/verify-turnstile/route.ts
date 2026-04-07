import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) return rateLimited;

  const { token } = await request.json();

  if (!token) {
    return NextResponse.json({ error: 'Verification required' }, { status: 400 });
  }

  // Skip verification if no secret key (dev mode)
  if (!process.env.TURNSTILE_SECRET_KEY) {
    return NextResponse.json({ data: { success: true } });
  }

  // Verify with Cloudflare
  const res = await fetch(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );

  const result = await res.json();

  if (!result.success) {
    return NextResponse.json(
      { error: 'Bot verification failed. Please try again.' },
      { status: 403 }
    );
  }

  return NextResponse.json({ data: { success: true } });
}
