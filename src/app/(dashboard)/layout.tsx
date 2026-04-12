import Link from 'next/link';
import { eq } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { user } from '@/shared/database/schema';
import { requireAuth } from '@/lib/require-auth';
import { LogoutButton } from './logout-button';
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
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2 sm:gap-6">
            <Link href="/dashboard" className="font-heading font-bold text-lg gradient-text shrink-0">
              Cheetah Ping
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/dashboard"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200"
              >
                Settings
              </Link>
              <Link
                href="/docs"
                className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200 hidden sm:block"
              >
                Docs
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-primary/70 hover:text-primary hover:bg-primary/5 px-2 sm:px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block truncate max-w-[200px]">{authUser.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 flex-1">{children}</main>
      <SiteFooter />
      <AnalyticsIdentify />
      <SyncAttribution />
    </div>
  );
}
