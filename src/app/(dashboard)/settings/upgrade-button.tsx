'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Plan } from '@/lib/plan-limits';

interface UpgradeButtonProps {
  plan: Plan;
  className?: string;
  variant?: 'default' | 'outline';
  label?: string;
}

export function UpgradeButton({
  plan,
  className = '',
  variant = 'default',
  label,
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const endpoint =
        label === 'Manage billing' ? '/api/billing/portal' : '/api/checkout';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout');
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const baseStyles = 'inline-flex items-center justify-center rounded-xl text-sm font-medium h-8 px-3 disabled:opacity-50';

  const variantStyles =
    variant === 'outline'
      ? 'glass glass-hover hover-glow text-foreground'
      : 'glow-button';

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${className}`}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : label || `Upgrade to ${plan}`}
    </button>
  );
}
