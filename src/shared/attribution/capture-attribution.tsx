'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const COOKIE_NAME = 'cp_attr';
const EXAMPLE_COOKIE = 'cp_example_url';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days
const CONSENT_KEY = 'cp_cookie_consent';

function hasConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === 'accepted';
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
}

export function CaptureAttribution() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get('utm_source') || searchParams.get('src') || searchParams.get('ref');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');

    // Attribution cookie requires consent (non-essential)
    if (source && hasConsent()) {
      const attr = JSON.stringify({
        source,
        medium: medium || undefined,
        campaign: campaign || undefined,
        ts: Date.now(),
      });
      setCookie(COOKIE_NAME, attr);
    }

    // Example URL cookie is functional (prefills the monitor form), set regardless
    const exampleUrl = searchParams.get('example');
    if (exampleUrl) {
      setCookie(EXAMPLE_COOKIE, exampleUrl);
    }
  }, [searchParams]);

  return null;
}
