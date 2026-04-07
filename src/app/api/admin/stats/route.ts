import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user, monitors } from '@/shared/database/schema';
import { count, eq, sql } from 'drizzle-orm';
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

  const [{ value: totalUsers }] = await db.select({ value: count() }).from(user);
  const [{ value: totalMonitors }] = await db.select({ value: count() }).from(monitors);
  const [{ value: activeMonitors }] = await db
    .select({ value: count() })
    .from(monitors)
    .where(eq(monitors.status, 'active'));

  const planCounts = await db
    .select({ plan: user.plan, value: count() })
    .from(user)
    .groupBy(user.plan);

  return NextResponse.json({
    data: {
      totalUsers,
      totalMonitors,
      activeMonitors,
      planBreakdown: Object.fromEntries(planCounts.map((p) => [p.plan, p.value])),
    },
  });
}
