import { eq, count } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { PLAN_LIMITS, PLAN_DISPLAY } from '@/lib/plan-limits';
import { MonitorForm } from './monitor-form';
import { LinkButton } from '@/shared/components/link-button';
import { NewMonitorShell } from './new-monitor-shell';

export default async function NewMonitorPage() {
  const user = await requireAuth();
  const limits = PLAN_LIMITS[user.plan];

  const [{ value: monitorCount }] = await db
    .select({ value: count() })
    .from(monitors)
    .where(eq(monitors.userId, user.userId));

  if (monitorCount >= limits.maxMonitors) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-16">
        <h1 className="font-heading text-2xl font-bold">Monitor limit reached</h1>
        <p className="text-muted-foreground">
          You're using all {limits.maxMonitors} monitors on your{' '}
          {PLAN_DISPLAY[user.plan].name} plan. Upgrade to add more.
        </p>
        <div className="flex gap-2 justify-center">
          <LinkButton href="/dashboard" variant="outline">
            Back to dashboard
          </LinkButton>
          <LinkButton href="/settings">
            Upgrade plan
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <NewMonitorShell plan={user.plan}>
      <MonitorForm plan={user.plan} />
    </NewMonitorShell>
  );
}
