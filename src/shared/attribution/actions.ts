'use server';

import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function syncAttribution(source: string): Promise<{ synced: boolean }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return { synced: false };

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userData) return { synced: false };

  // Only set referredBy if it's not already set and account is recent (< 10 min)
  const referredBy = (userData as Record<string, unknown>).referredBy as string | null;
  if (referredBy) return { synced: true }; // already attributed

  const createdAt = userData.createdAt ? new Date(userData.createdAt) : null;
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

  if (!createdAt || createdAt < tenMinutesAgo) {
    return { synced: true }; // too old, don't overwrite
  }

  await db
    .update(user)
    .set({ referredBy: source })
    .where(eq(user.id, session.user.id));

  return { synced: true };
}
