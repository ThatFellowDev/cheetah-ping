import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { getStripe } from '@/modules/billing/stripe';

export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete Stripe customer if one exists
  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  const stripeCustomerId = (userData as Record<string, unknown>)?.stripeCustomerId as string | null;
  if (stripeCustomerId) {
    const stripe = getStripe();
    if (stripe) {
      try {
        await stripe.customers.del(stripeCustomerId);
      } catch {
        // Stripe customer may already be deleted; continue with account deletion
      }
    }
  }

  // Cascading deletes handle monitors, change_log, sessions, accounts, verification
  await db.delete(user).where(eq(user.id, session.user.id));

  return NextResponse.json({ data: { success: true } });
}
