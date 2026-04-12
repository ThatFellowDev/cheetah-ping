import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors } from '@/shared/database/schema';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, id), eq(monitors.userId, session.user.id)),
  });

  if (!monitor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [updated] = await db
    .update(monitors)
    .set({
      status: 'active',
      consecutiveErrors: 0,
      errorMessage: null,
    })
    .where(and(eq(monitors.id, id), eq(monitors.userId, session.user.id)))
    .returning();

  return NextResponse.json({ data: updated });
}
