import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { getStripe, getPriceId } from '@/modules/billing/stripe';
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

  const body = await request.json();
  const priceId = getPriceId(body.plan);
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  // Get or create Stripe customer
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  let customerId = (userData as Record<string, unknown>)?.stripeCustomerId as string | null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;

    await db
      .update(user)
      .set({ stripeCustomerId: customerId })
      .where(eq(user.id, session.user.id));
  }

  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000';

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/checkout/success?plan=${body.plan}`,
    cancel_url: `${baseUrl}/settings`,
    metadata: { userId: session.user.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
