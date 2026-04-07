import { NextRequest, NextResponse } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors, changeLog } from '@/shared/database/schema';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';

export async function GET(
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

  const changes = await db.query.changeLog.findMany({
    where: eq(changeLog.monitorId, id),
    orderBy: [desc(changeLog.detectedAt)],
    limit: 50,
  });

  return NextResponse.json({ data: changes });
}
