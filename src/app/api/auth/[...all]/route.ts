import { toNextJsHandler } from 'better-auth/next-js';
import { auth } from '@/modules/auth/auth';
import { rateLimit } from '@/lib/rate-limit';

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  // Rate limit all auth POST requests (5 per minute per IP)
  const rateLimited = await rateLimit(request, { limit: 5, window: '1 m' });
  if (rateLimited) return rateLimited;

  return handler.POST(request);
}
