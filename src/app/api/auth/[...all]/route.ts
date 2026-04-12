import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/modules/auth/auth';
import { rateLimit } from '@/lib/rate-limit';

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  // Rate limit magic link and sign-in attempts (3 per minute per IP)
  const url = new URL(request.url);
  if (url.pathname.includes('magic-link') || url.pathname.includes('sign-in')) {
    const rateLimited = await rateLimit(request, { limit: 3, window: '1 m' });
    if (rateLimited) return rateLimited;
  }

  return handler.POST(request);
}
