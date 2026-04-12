'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

const COOKIE_NAME = 'cp_attr';
const EXAMPLE_COOKIE = 'cp_example_url';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${COOKIE_MAX_AGE};samesite=lax`;
}

export function CaptureAttribution() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get('utm_source') || searchParams.get('src') || searchParams.get('ref');
    const medium = searchParams.get('utm_medium');
    const campaign = searchParams.get('utm_campaign');

    if (source) {
      const attr = JSON.stringify({
        source,
        medium: medium || undefined,
        campaign: campaign || undefined,
        ts: Date.now(),
      });
      setCookie(COOKIE_NAME, attr);
    }

    const exampleUrl = searchParams.get('example');
    if (exampleUrl) {
      setCookie(EXAMPLE_COOKIE, exampleUrl);
    }
  }, [searchParams]);

  return null;
}
