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
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img src="/icon.png" alt="" className="w-6 h-6" />
            <span className="font-heading font-bold text-lg gradient-text">Cheetah Ping</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <div className="relative group">
              <Link href="/use-cases" className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
                Use Cases
              </Link>
              <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                <div className="w-48 rounded-lg bg-popover border border-white/10 shadow-xl p-1 text-sm">
                  <Link href="/use-cases#personal" className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Personal</Link>
                  <Link href="/use-cases#business" className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Business</Link>
                  <Link href="/use-cases#industry" className="block px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors">Industry</Link>
                </div>
              </div>
            </div>
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
