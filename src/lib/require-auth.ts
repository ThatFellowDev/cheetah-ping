import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import type { Plan } from '@/lib/plan-limits';

export type AuthUser = {
  userId: string;
  email: string;
  plan: Plan;
  name: string;
};

export async function requireAuth(): Promise<AuthUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect('/login');
  }

  // Auto-promote admin via env var (runs once, idempotent)
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && session.user.email === adminEmail) {
    await db
      .update(user)
      .set({ isAdmin: true })
      .where(eq(user.id, session.user.id));
  }

  return {
    userId: session.user.id,
    email: session.user.email,
    plan: ((session.user as Record<string, unknown>).plan as Plan) || 'free',
    name: session.user.name || '',
  };
}
