'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import posthog from 'posthog-js';

const CONSENT_KEY = 'cp_cookie_consent';

type ConsentState = 'pending' | 'accepted' | 'declined';

function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'pending';
  return (localStorage.getItem(CONSENT_KEY) as ConsentState) || 'pending';
}

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentState>('accepted'); // SSR default: hide banner
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setConsent(getConsent());
  }, []);

  if (!mounted || consent !== 'pending') return null;

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setConsent('accepted');
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setConsent('declined');
    // Opt out of PostHog
    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.opt_out_capturing();
    }
    // Remove attribution cookie
    document.cookie = 'cp_attr=;path=/;max-age=0';
    document.cookie = 'cp_example_url=;path=/;max-age=0';
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6">
      <div className="mx-auto max-w-lg glass rounded-xl p-4 sm:p-5 border border-white/10 shadow-2xl">
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          We use cookies for login and optional analytics to improve Cheetah Ping.
          See our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={accept}
            className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Accept all
          </button>
          <button
            onClick={decline}
            className="flex-1 h-9 rounded-lg glass glass-hover text-sm font-medium transition-colors"
          >
            Essential only
          </button>
        </div>
      </div>
    </div>
  );
}