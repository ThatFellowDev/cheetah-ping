import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user, monitors } from '@/shared/database/schema';
import { eq, count, desc, sql } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  if (!(userData as any)?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      monitorCount: sql<number>`(SELECT COUNT(*) FROM monitors WHERE monitors.user_id = "user".id)`,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  return NextResponse.json({ data: users });
}
