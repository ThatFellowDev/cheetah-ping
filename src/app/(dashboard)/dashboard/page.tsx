import { eq } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { PLAN_LIMITS } from '@/lib/plan-limits';
import { PlanLimitBar } from '@/shared/components/plan-limit-bar';
import { LinkButton } from '@/shared/components/link-button';
import { MonitorList } from './monitor-list';
import { OnboardingEmptyState } from './onboarding-empty-state';
import { Plus, Radar } from 'lucide-react';

export default async function DashboardPage() {
  const user = await requireAuth();
  const limits = PLAN_LIMITS[user.plan];

  const userMonitors = await db.query.monitors.findMany({
    where: eq(monitors.userId, user.userId),
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  });

  if (userMonitors.length === 0) {
    return <OnboardingEmptyState plan={user.plan} />;
  }

  // Calculate checks performed this week (estimated from active monitors × interval)
  const weekMinutes = 7 * 24 * 60;
  const now = Date.now();
  const checksThisWeek = userMonitors
    .filter((m) => m.status === 'active')
    .reduce((sum, m) => {
      const ageMinutes = Math.min(weekMinutes, (now - new Date(m.createdAt).getTime()) / 60_000);
      return sum + Math.floor(ageMinutes / m.checkIntervalMinutes);
    }, 0);

  const activeCount = userMonitors.filter((m) => m.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Monitors</h1>
        <LinkButton
          href="/monitors/new"
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground border-0 hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Monitor
        </LinkButton>
      </div>

      {checksThisWeek > 0 && (
        <div className="glass rounded-xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Radar className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">
              We've checked your pages{' '}
              <span className="font-bold text-primary">{checksThisWeek.toLocaleString()}</span>{' '}
              {checksThisWeek === 1 ? 'time' : 'times'} this week
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Watching {activeCount} {activeCount === 1 ? 'page' : 'pages'} so you don't have to
            </p>
          </div>
        </div>
      )}

      <PlanLimitBar current={userMonitors.length} max={limits.maxMonitors} />

      <MonitorList monitors={userMonitors} />
    </div>
  );
}
