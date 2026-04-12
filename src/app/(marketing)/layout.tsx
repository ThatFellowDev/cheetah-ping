import { Suspense } from 'react';
import Link from 'next/link';
import { LinkButton } from '@/shared/components/link-button';
import { CaptureAttribution } from '@/shared/attribution/capture-attribution';

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
          <div className="flex items-center gap-3 shrink-0">
            <LinkButton href="/login" variant="ghost" size="sm">
              Log in
            </LinkButton>
            <LinkButton
              href="/login"
              size="sm"
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow border-0"
            >
              Get started free
            </LinkButton>
          </div>
        </div>
      </header>
      <Suspense>
        <CaptureAttribution />
      </Suspense>
      {children}
      <footer className="border-t border-white/5 py-8 mt-16">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between text-sm text-muted-foreground">
          <span className="gradient-text font-heading font-semibold">Cheetah Ping</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
