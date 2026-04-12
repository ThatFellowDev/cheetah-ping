import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/database/db';
import { user, monitors, changeLog } from '@/shared/database/schema';
import { eq, lt, and, inArray } from 'drizzle-orm';
import { PLAN_LIMITS } from '@/lib/plan-limits';

async function runRetention() {
  let totalDeleted = 0;

  for (const [plan, limits] of Object.entries(PLAN_LIMITS)) {
    const cutoff = new Date(Date.now() - limits.historyDays * 24 * 60 * 60 * 1000);

    const usersOnPlan = await db.query.user.findMany({
      where: eq(user.plan, plan),
      columns: { id: true },
    });

    if (usersOnPlan.length === 0) continue;

    const userIds = usersOnPlan.map((u) => u.id);

    const userMonitors = await db.query.monitors.findMany({
      where: inArray(monitors.userId, userIds),
      columns: { id: true },
    });

    if (userMonitors.length === 0) continue;

    const monitorIds = userMonitors.map((m) => m.id);

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

  return totalDeleted;
}

function authorize(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return true; // no secret = dev mode, allow

  // Vercel Crons send the secret in the Authorization header
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// Vercel Cron calls GET
export async function GET(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await runRetention();

  return NextResponse.json({
    success: true,
    deleted,
    timestamp: new Date().toISOString(),
  });
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const deleted = await runRetention();

  return NextResponse.json({
    success: true,
    deleted,
    timestamp: new Date().toISOString(),
  });
}
