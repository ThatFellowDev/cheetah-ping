import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { getStripe } from '@/modules/billing/stripe';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const customerId = (userData as Record<string, unknown>)?.stripeCustomerId as string | null;
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
  }

  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
