import { eq, count, sql } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { user, monitors } from '@/shared/database/schema';
import { requireAdmin } from '@/lib/require-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LinkButton } from '@/shared/components/link-button';
import { Users, Activity, BarChart3 } from 'lucide-react';

export default async function AdminPage() {
  await requireAdmin();

  const [{ value: totalUsers }] = await db.select({ value: count() }).from(user);
  const [{ value: totalMonitors }] = await db.select({ value: count() }).from(monitors);
  const [{ value: activeMonitors }] = await db
    .select({ value: count() })
    .from(monitors)
    .where(eq(monitors.status, 'active'));

  const planCounts = await db
    .select({ plan: user.plan, value: count() })
    .from(user)
    .groupBy(user.plan);

  const planMap = Object.fromEntries(planCounts.map((p) => [p.plan, p.value]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Admin</h1>
        <LinkButton href="/admin/users" variant="outline">
          Manage users
        </LinkButton>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="glass border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-heading font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground">Total users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-heading font-bold">
                  {activeMonitors} <span className="text-sm text-muted-foreground font-normal">/ {totalMonitors}</span>
                </p>
                <p className="text-xs text-muted-foreground">Active monitors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-heading font-bold">
                  ${(planMap.starter || 0) * 9 + (planMap.pro || 0) * 19 + (planMap.ultra || 0) * 49}
                </p>
                <p className="text-xs text-muted-foreground">Monthly revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Plan distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            {['free', 'starter', 'pro', 'ultra'].map((plan) => (
              <div key={plan}>
                <p className="text-lg font-bold">{planMap[plan] || 0}</p>
                <p className="text-xs text-muted-foreground capitalize">{plan}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
