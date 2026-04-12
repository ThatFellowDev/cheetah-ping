import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';

const limiters = new Map<string, Ratelimit>();

function getRateLimiter(limit = 5, window = '1 m') {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;

  const key = `${limit}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(
      key,
      new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
        prefix: `ratelimit:${key}`,
      })
    );
  }
  return limiters.get(key)!;
}

export async function rateLimit(
  request: Request,
  opts?: { limit?: number; window?: string; identifier?: string }
) {
  const limiter = getRateLimiter(opts?.limit, opts?.window);
  if (!limiter) return null; // No Redis = skip rate limiting (dev mode)

  const ip =
    opts?.identifier ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown';

  const { success, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      }
    );
  }

  return null; // Allowed
}
