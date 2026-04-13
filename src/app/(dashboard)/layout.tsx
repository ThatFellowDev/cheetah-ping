import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { DashboardNav } from './dashboard-nav';
import { AnalyticsIdentify } from '@/shared/analytics/identify';
import { SyncAttribution } from '@/shared/attribution/sync-attribution';
import { SiteFooter } from '@/shared/components/site-footer';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authUser = await requireAuth();

  // Check admin status
  const userData = await db.query.user.findFirst({
    where: eq(user.id, authUser.userId),
  });
  const isAdmin = (userData as any)?.isAdmin === true;

  return (
    <div className="min-h-screen flex flex-col max-w-full">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 sm:gap-6 flex-1 min-w-0">
            <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
              <img src="/icon.png" alt="" className="w-6 h-6" />
              <span className="font-heading font-bold text-lg gradient-text">Cheetah Ping</span>
            </Link>
            <DashboardNav email={authUser.email} isAdmin={isAdmin} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl w-full px-4 py-8 flex-1">{children}</main>
      <SiteFooter />
      <AnalyticsIdentify />
      <SyncAttribution />
    </div>
  );
}
