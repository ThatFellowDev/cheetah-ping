import { eq, and, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/shared/database/db';
import { monitors, changeLog } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { MonitorDetail } from './monitor-detail';

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const monitor = await db.query.monitors.findFirst({
    where: and(eq(monitors.id, id), eq(monitors.userId, user.userId)),
  });

  if (!monitor) notFound();

  const changes = await db.query.changeLog.findMany({
    where: eq(changeLog.monitorId, id),
    orderBy: [desc(changeLog.detectedAt)],
    limit: 50,
  });

  return <MonitorDetail monitor={monitor} changes={changes} />;
}
