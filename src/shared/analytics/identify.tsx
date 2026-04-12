'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useSession } from '@/modules/auth/auth-client';

async function hashId(id: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(id);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16); // 16 hex chars is enough for analytics
}

export function AnalyticsIdentify() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const plan = (session?.user as Record<string, unknown> | undefined)?.plan as string | undefined;

  useEffect(() => {
    if (!userId) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    hashId(userId).then((hashedId) => {
      posthog.identify(hashedId, {
        plan: plan ?? 'free',
      });
    });
  }, [userId, plan]);

  return null;
}
