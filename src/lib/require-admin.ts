import { requireAuth } from './require-auth';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const authUser = await requireAuth();

  const userData = await db.query.user.findFirst({
    where: eq(user.id, authUser.userId),
  });

  if (!(userData as any)?.isAdmin) {
    redirect('/dashboard');
  }

  return authUser;
}
