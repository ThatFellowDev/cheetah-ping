import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 pb-24 pt-10 mt-auto">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <img src="/cheetah-ping-logo.png" alt="" className="w-8 h-8 rounded-lg" />
              <span className="gradient-text font-heading font-bold text-lg">Cheetah Ping</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Website change monitoring. Get alerted the moment something changes.
            </p>
          </div>
          <div className="flex gap-12 sm:gap-16 text-sm">
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground uppercase text-xs tracking-wider">Product</span>
              <a href="/#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Link href="/use-cases" className="text-muted-foreground hover:text-foreground transition-colors">Use Cases</Link>
              <a href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
              <a href="/#compare" className="text-muted-foreground hover:text-foreground transition-colors">Compare</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground uppercase text-xs tracking-wider">Resources</span>
              <Link href="/docs" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link>
              <a href="/#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              <a href="mailto:cheetahping@protonmail.com" className="text-muted-foreground hover:text-foreground transition-colors">Support</a>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-semibold text-foreground uppercase text-xs tracking-wider">Legal</span>
              <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} That Fellow Digital LLC. All rights reserved. Cheetah Ping is a trademark of That Fellow Digital LLC.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <a href="mailto:cheetahping@protonmail.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
