import { db } from '@/shared/database/db';
import { monitors, user } from '@/shared/database/schema';
import { eq, desc } from 'drizzle-orm';
import { PLAN_LIMITS, type Plan } from '@/lib/plan-limits';
import { sendEmail } from '@/lib/email';

export async function handleDowngrade(userId: string) {
  const userData = await db.query.user.findFirst({
    where: eq(user.id, userId),
  });
  if (!userData) return;

  const plan = (userData.plan || 'free') as Plan;
  const limits = PLAN_LIMITS[plan];

  const activeMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, userId),
    orderBy: [desc(monitors.createdAt)],
  });

  const activeCount = activeMonitors.filter((m) => m.status === 'active').length;
  if (activeCount <= limits.maxMonitors) return;

  const toDisable = activeMonitors
    .filter((m) => m.status === 'active')
    .slice(limits.maxMonitors);

  for (const monitor of toDisable) {
    await db
      .update(monitors)
      .set({ status: 'paused' })
      .where(eq(monitors.id, monitor.id));
  }

  await sendEmail({
    to: userData.email,
    subject: 'Your Cheetah Ping plan has changed',
    html: `
      <h2>Plan Updated</h2>
      <p>Your plan has been changed to <strong>${plan}</strong>.</p>
      ${toDisable.length > 0 ? `
        <p>${toDisable.length} monitor(s) have been paused because they exceed your new plan's limit of ${limits.maxMonitors} monitors.</p>
        <p>You can choose which monitors to keep active from your <a href="${process.env.BETTER_AUTH_URL}/dashboard">dashboard</a>.</p>
      ` : ''}
    `,
  });
}
