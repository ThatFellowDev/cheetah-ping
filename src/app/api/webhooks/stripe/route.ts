import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getPlanFromPriceId } from '@/modules/billing/stripe';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { handleDowngrade } from '@/modules/billing/downgrade';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const customerId = session.customer as string;

      if (userId && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : 'free';

        await db
          .update(user)
          .set({ stripeCustomerId: customerId, plan })
          .where(eq(user.id, userId));
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const priceId = subscription.items.data[0]?.price.id;
      const plan = priceId ? getPlanFromPriceId(priceId) : 'free';

      const existingUser = await db.query.user.findFirst({
        where: eq(user.stripeCustomerId, customerId),
      });

      if (existingUser) {
        await db
          .update(user)
          .set({ plan })
          .where(eq(user.id, existingUser.id));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const existingUser = await db.query.user.findFirst({
        where: eq(user.stripeCustomerId, customerId),
      });

      if (existingUser) {
        await db
          .update(user)
          .set({ plan: 'free' })
          .where(eq(user.id, existingUser.id));

        await handleDowngrade(existingUser.id);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
