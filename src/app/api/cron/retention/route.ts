import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/database/db';
import { user, monitors, changeLog } from '@/shared/database/schema';
import { eq, lt, and, inArray } from 'drizzle-orm';
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits';

export async function POST(request: NextRequest) {
  // Protect with a secret so only authorized callers can trigger retention
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalDeleted = 0;

  // Process each plan tier
  for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
    const cutoff = new Date(Date.now() - limits.historyDays * 24 * 60 * 60 * 1000);

    // Find all users on this plan
    const usersOnPlan = await db.query.user.findMany({
      where: eq(user.plan, plan),
      columns: { id: true },
    });

    if (usersOnPlan.length === 0) continue;

    const userIds = usersOnPlan.map((u) => u.id);

    // Find monitors belonging to these users
    const userMonitors = await db.query.monitors.findMany({
      where: inArray(monitors.userId, userIds),
      columns: { id: true },
    });

    if (userMonitors.length === 0) continue;

    const monitorIds = userMonitors.map((m) => m.id);

    // Delete change logs older than the plan's retention window
    const result = await db
      .delete(changeLog)
      .where(
        and(
          inArray(changeLog.monitorId, monitorIds),
          lt(changeLog.detectedAt, cutoff)
        )
      )
      .returning({ id: changeLog.id });

    totalDeleted += result.length;
  }

  return NextResponse.json({
    success: true,
    deleted: totalDeleted,
    timestamp: new Date().toISOString(),
  });
}
