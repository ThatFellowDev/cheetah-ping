import { NextResponse } from 'next/server';
import { auth } from '@/modules/auth/auth';
import { db } from '@/shared/database/db';
import { user, monitors, changeLog, session } from '@/shared/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

export async function GET() {
  const authSession = await auth.api.getSession({ headers: await headers() });
  if (!authSession?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = authSession.user.id;

  // Collect all user data
  const userData = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });

  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
  });

  const monitorIds = userMonitors.map((m) => m.id);

  let changes: typeof changeLog.$inferSelect[] = [];
  if (monitorIds.length > 0) {
    const { inArray } = await import('drizzle-orm');
    changes = await db.query.changeLog.findMany({
      where: inArray(changeLog.monitorId, monitorIds),
    });
  }

  const sessions = await db.query.session.findMany({
    where: eq(session.userId, userId),
    columns: {
      id: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      expiresAt: true,
    },
  });

  // Strip sensitive internal fields
  const exportData = {
    exportedAt: new Date().toISOString(),
    format: 'Cheetah Ping GDPR Data Export v1',
    user: {
      id: userData?.id,
      email: userData?.email,
      name: userData?.name,
      plan: userData?.plan,
      referredBy: userData?.referredBy,
      createdAt: userData?.createdAt,
    },
    monitors: userMonitors.map((m) => ({
      id: m.id,
      url: m.url,
      label: m.label,
      selector: m.selector,
      keyword: m.keyword,
      checkIntervalMinutes: m.checkIntervalMinutes,
      status: m.status,
      createdAt: m.createdAt,
      lastCheckedAt: m.lastCheckedAt,
      lastChangedAt: m.lastChangedAt,
    })),
    changeHistory: changes.map((c) => ({
      id: c.id,
      monitorId: c.monitorId,
      detectedAt: c.detectedAt,
      diffSummary: c.diffSummary,
      aiSummary: c.aiSummary,
    })),
    sessions: sessions,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cheetah-ping-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
