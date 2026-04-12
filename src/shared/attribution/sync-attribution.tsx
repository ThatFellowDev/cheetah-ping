'use client';

import { useEffect, useRef } from 'react';
import { syncAttribution } from './actions';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

export function SyncAttribution() {
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    const raw = getCookie('cp_attr');
    if (!raw) return;

    try {
      const attr = JSON.parse(raw) as { source?: string };
      if (attr.source) {
        syncAttribution(attr.source).then((result) => {
          if (result?.synced) {
            deleteCookie('cp_attr');
          }
        });
      }
    } catch {
      // invalid cookie, clean up
      deleteCookie('cp_attr');
    }
  }, []);

  return null;
}
