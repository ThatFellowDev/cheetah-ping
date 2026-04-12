import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { getDocsContext } from '@/lib/docs-context';
import { rateLimit } from '@/lib/rate-limit';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: 'Chat is currently unavailable. Please try again later.' },
      { status: 503 }
    );
  }

  // Auth check (optional for chat, used for rate limit identity)
  const session = await auth.api.getSession({ headers: await headers() });
  const identifier = session?.user?.id ??
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown';

  // Rate limit: 20/min for authenticated, 5/min for anonymous
  const rateLimited = await rateLimit(request, {
    identifier: `chat:${identifier}`,
    limit: session ? 20 : 5,
    window: '1 m',
  });
  if (rateLimited) return rateLimited;

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'Messages are required.' },
      { status: 400 }
    );
  }

  const docsContext = getDocsContext();

  const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

  const result = streamText({
    model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
    system: `You are the Cheetah Ping Assistant, a helpful support bot for the Cheetah Ping website change monitoring platform. Answer questions using the documentation below. Be concise and friendly. If you don't know the answer or it's not covered in the documentation, say so honestly. Never use em dashes in your responses. Use periods, commas, or colons instead.

Documentation:
${docsContext}`,
    messages,
    temperature: 0.2,
    maxOutputTokens: 512,
  });

  return result.toUIMessageStreamResponse();
}
