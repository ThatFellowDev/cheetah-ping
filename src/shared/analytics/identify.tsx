'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useSession } from '@/modules/auth/auth-client';

export function AnalyticsIdentify() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const plan = (session?.user as Record<string, unknown> | undefined)?.plan as string | undefined;

  useEffect(() => {
    if (!userId) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    posthog.identify(userId, {
      plan: plan ?? 'free',
    });
  }, [userId, plan]);

  return null;
}
