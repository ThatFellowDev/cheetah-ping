import { NextRequest, NextResponse } from 'next/server';
import { eq, and, count } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors, user } from '@/shared/database/schema';
import { auth } from '@/modules/auth/auth';
import { createMonitorSchema } from '@/modules/monitoring/lib/schemas';
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits';
import { rateLimit } from '@/lib/rate-limit';
import { isSafeUrl } from '@/lib/validate-url';
import { headers } from 'next/headers';

async function getUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });
  return userData;
}

export async function GET(request: NextRequest) {
  const userData = await getUser(request);
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userData.id),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });

  return NextResponse.json({ data: userMonitors });
}

export async function POST(request: NextRequest) {
  const rateLimited = await rateLimit(request);
  if (rateLimited) return rateLimited;

  const userData = await getUser(request);
  if (!userData) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createMonitorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (!isSafeUrl(parsed.data.url)) {
    return NextResponse.json(
      { error: 'This URL is not allowed. Internal and private network addresses are blocked.' },
      { status: 400 }
    );
  }

  const plan = (userData.plan || 'free') as Plan;
  const limits = PLAN_LIMITS[plan];

  // Enforce monitor count limit
  const [{ value: monitorCount }] = await db
    .select({ value: count() })
    .from(monitors)
    .where(eq(monitors.userId, userData.id));

  if (monitorCount >= limits.maxMonitors) {
    return NextResponse.json(
      { error: `You've reached the ${limits.maxMonitors} monitor limit on your ${plan} plan. Upgrade for more.` },
      { status: 403 }
    );
  }

  // Enforce frequency limit
  if (parsed.data.checkIntervalMinutes < limits.minIntervalMinutes) {
    return NextResponse.json(
      { error: `Your ${plan} plan allows checks every ${limits.minIntervalMinutes} minutes at most.` },
      { status: 403 }
    );
  }

  // Only trust lastScreenshotUrl if it points at our own R2 bucket — prevents
  // a malicious caller from injecting an arbitrary URL into the field.
  const r2Prefix = process.env.R2_PUBLIC_URL;
  const trustedScreenshotUrl =
    parsed.data.lastScreenshotUrl && r2Prefix && parsed.data.lastScreenshotUrl.startsWith(r2Prefix + '/')
      ? parsed.data.lastScreenshotUrl
      : null;

  const [newMonitor] = await db
    .insert(monitors)
    .values({
      userId: userData.id,
      url: parsed.data.url,
      label: parsed.data.label || null,
      selector: parsed.data.selector || null,
      keyword: parsed.data.keyword || null,
      checkIntervalMinutes: parsed.data.checkIntervalMinutes,
      lastScreenshotUrl: trustedScreenshotUrl,
    })
    .returning();

  return NextResponse.json({ data: newMonitor }, { status: 201 });
}
