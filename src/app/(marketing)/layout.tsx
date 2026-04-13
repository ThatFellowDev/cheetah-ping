import { Suspense } from 'react';
import Link from 'next/link';
import { LinkButton } from '@/shared/components/link-button';
import { CaptureAttribution } from '@/shared/attribution/capture-attribution';
import { SiteFooter } from '@/shared/components/site-footer';
import { MarketingMobileNav } from './marketing-mobile-nav';
import { auth } from '@/modules/auth/auth';
import { headers } from 'next/headers';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() }).catch(() => null);
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 h-14">
          <Link href="/" className="font-heading font-bold text-lg gradient-text shrink-0">
            Cheetah Ping
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/use-cases" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Use Cases</Link>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">How It Works</a>
            <a href="#compare" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Compare</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">Pricing</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">FAQ</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isLoggedIn ? (
              <LinkButton
                href="/dashboard"
                size="sm"
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow border-0 text-xs sm:text-sm"
              >
                Dashboard
              </LinkButton>
            ) : (
              <>
                <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                  Log in
                </LinkButton>
                <LinkButton
                  href="/login"
                  size="sm"
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow border-0 text-xs sm:text-sm"
                >
                  Get started free
                </LinkButton>
              </>
            )}
            <MarketingMobileNav isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </header>
      <Suspense>
        <CaptureAttribution />
      </Suspense>
      {children}
      <SiteFooter />
    </div>
  );
}
