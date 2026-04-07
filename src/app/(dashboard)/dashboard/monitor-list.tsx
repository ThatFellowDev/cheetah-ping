'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { MonitorCard } from './monitor-card';

interface Monitor {
  id: string;
  url: string;
  label: string | null;
  status: string;
  checkIntervalMinutes: number;
  lastCheckedAt: Date | null;
  lastChangedAt: Date | null;
  createdAt: Date;
}

export function MonitorList({ monitors }: { monitors: Monitor[] }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = monitors.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (m.label?.toLowerCase().includes(q) ?? false) ||
        m.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: monitors.length,
    active: monitors.filter((m) => m.status === 'active').length,
    paused: monitors.filter((m) => m.status === 'paused').length,
    error: monitors.filter((m) => m.status === 'error').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="paused">Paused ({counts.paused})</TabsTrigger>
            <TabsTrigger value="error">Error ({counts.error})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search monitors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No monitors match your filters.
        </p>
      ) : (
        <div className="grid gap-3">
          {filtered.map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}
