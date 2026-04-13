import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors, changeLog } from '@/shared/database/schema';
import { auth } from '@/modules/auth/auth';
import { updateMonitorSchema } from '@/modules/monitoring/lib/schemas';
import { headers } from 'next/headers';
import { deleteFromR2, r2KeyFromUrl } from '@/lib/r2';

async function getAuthUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user;
}

async function getOwnedMonitor(monitorId: string, userId: string) {
  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, monitorId), eq(monitors.userId, userId)),
  });
  return monitor;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getOwnedMonitor(id, authUser.id);
  if (!monitor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ data: monitor });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getOwnedMonitor(id, authUser.id);
  if (!monitor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(monitors)
    .set(parsed.data)
    .where(and(eq(monitors.id, id), eq(monitors.userId, authUser.id)))
    .returning();

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authUser = await getAuthUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getOwnedMonitor(id, authUser.id);
  if (!monitor) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Collect all R2 screenshot URLs before deleting DB rows (cascade deletes change_log)
  const changes = await db.query.changeLog.findMany({
    where: eq(changeLog.monitorId, id),
    columns: { beforeScreenshotUrl: true, afterScreenshotUrl: true },
  });

  const screenshotUrls = new Set<string>();
  if (monitor.lastScreenshotUrl) screenshotUrls.add(monitor.lastScreenshotUrl);
  for (const change of changes) {
    if (change.beforeScreenshotUrl) screenshotUrls.add(change.beforeScreenshotUrl);
    if (change.afterScreenshotUrl) screenshotUrls.add(change.afterScreenshotUrl);
  }

  // Delete the monitor (cascades to change_log rows)
  await db.delete(monitors).where(and(eq(monitors.id, id), eq(monitors.userId, authUser.id)));

  // Clean up R2 objects in the background (best-effort, don't block the response)
  for (const url of screenshotUrls) {
    const key = r2KeyFromUrl(url);
    if (key) deleteFromR2(key).catch(() => {});
  }

  return NextResponse.json({ data: { success: true } });
}
