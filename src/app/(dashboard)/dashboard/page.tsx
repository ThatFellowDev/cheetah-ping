import { eq } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { monitors } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { PLAN_LIMITS, PLAN_DISPLAY } from '@/lib/plan-limits';
import { PlanLimitBar } from '@/shared/components/plan-limit-bar';
import { LinkButton } from '@/shared/components/link-button';
import { MonitorList } from './monitor-list';
import { OnboardingEmptyState } from './onboarding-empty-state';
import { Plus } from 'lucide-react';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Monitors</h1>
        <LinkButton
          href="/monitors/new"
          className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground border-0 hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Monitor
        </LinkButton>
      </div>

      <PlanLimitBar current={userMonitors.length} max={limits.maxMonitors} />

      <MonitorList monitors={userMonitors} />
    </div>
  );
}
