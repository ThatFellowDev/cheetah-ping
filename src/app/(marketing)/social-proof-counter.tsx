'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export function SocialProofCounter() {
  const [stats, setStats] = useState<{ monitors: number; users: number } | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats || (stats.monitors < 10 && stats.users < 5)) return null;

  return (
    <div className="inline-flex items-center gap-6 glass rounded-full px-6 py-3">
      <Activity className="h-4 w-4 text-primary" />
      <div className="text-center">
        <p className="font-heading text-lg font-bold gradient-text">
          {stats.monitors.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">pages monitored</p>
      </div>
      <div className="h-8 w-px bg-white/10" />
      <div className="text-center">
        <p className="font-heading text-lg font-bold gradient-text">
          {stats.users.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">users watching</p>
      </div>
    </div>
  );
}
