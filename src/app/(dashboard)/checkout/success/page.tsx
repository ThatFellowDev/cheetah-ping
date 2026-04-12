'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { ANALYTICS_EVENTS } from '@/shared/analytics/events';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const validPlans = ['free', 'starter', 'pro', 'ultra'];
    const rawPlan = searchParams.get('plan') ?? '';
    const plan = validPlans.includes(rawPlan) ? rawPlan : 'unknown';

    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.capture(ANALYTICS_EVENTS.SUBSCRIPTION_ACTIVATED, {
        plan,
      });
    }

    // Small delay so the event can flush before navigation
    setTimeout(() => {
      router.replace('/dashboard?upgraded=true');
    }, 500);
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
          <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-heading text-xl font-bold">Payment confirmed</h1>
        <p className="text-sm text-muted-foreground">Setting up your plan...</p>
      </div>
    </div>
  );
}
