'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com';
const CONSENT_KEY = 'cp_cookie_consent';

// Pages where analytics should NOT load
const EXCLUDED_PATHS = ['/changes/'];

function hasConsent(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) return;
    if (!hasConsent()) return; // Don't init until user accepts cookies

    if (!initialized) {
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        persistence: 'localStorage',
        capture_pageview: true,
        autocapture: false,
        disable_session_recording: true,
      });
      setInitialized(true);
    }
  }, [pathname, initialized]);

  if (!POSTHOG_KEY || EXCLUDED_PATHS.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  if (!initialized) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
