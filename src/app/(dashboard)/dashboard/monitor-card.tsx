'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/shared/components/status-badge';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { toast } from 'sonner';
import { Pause, Play, Trash2, ExternalLink, Clock } from 'lucide-react';
import { FREQUENCY_OPTIONS } from '@/lib/plan-limits';

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

function formatFrequency(minutes: number) {
  return FREQUENCY_OPTIONS.find((f) => f.value === minutes)?.label || `Every ${minutes}m`;
}

function timeAgo(date: Date | null) {
  if (!date) return 'Never';
  const d = new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function MonitorCard({ monitor }: { monitor: Monitor }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    const action = monitor.status === 'active' ? 'pause' : 'resume';
    try {
      const res = await fetch(`/api/monitors/${monitor.id}/${action}`, { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success(`Monitor ${action === 'pause' ? 'paused' : 'resumed'}`);
      router.refresh();
    } catch {
      toast.error(`Failed to ${action} monitor`);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Monitor deleted');
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error('Failed to delete monitor');
    } finally {
      setLoading(false);
    }
  }

  const statusBorder =
    monitor.status === 'active'
      ? 'border-emerald-500/40 hover:border-emerald-500/60 hover:shadow-[0_0_20px_oklch(0.7_0.15_155_/_15%)]'
      : monitor.status === 'error'
      ? 'border-red-500/40 hover:border-red-500/60 hover:shadow-[0_0_20px_oklch(0.6_0.2_25_/_15%)]'
      : 'border-amber-500/40 hover:border-amber-500/60 hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_15%)]';

  return (
    <>
      <Card className={`glass glass-hover p-4 border ${statusBorder} transition-all`}>
        <div className="flex items-start justify-between gap-4">
          <Link href={`/monitors/${monitor.id}`} className="flex-1 min-w-0 group">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                {monitor.label || monitor.url}
              </h3>
              <StatusBadge status={monitor.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="truncate max-w-xs flex items-center gap-1">
                <ExternalLink className="h-3 w-3 shrink-0" />
                {monitor.url}
              </span>
              <span className="flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                {formatFrequency(monitor.checkIntervalMinutes)}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
              <span>Checked: {timeAgo(monitor.lastCheckedAt)}</span>
              <span>Changed: {timeAgo(monitor.lastChangedAt)}</span>
            </div>
          </Link>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggle}
              disabled={loading}
              title={monitor.status === 'active' ? 'Pause' : 'Resume'}
            >
              {monitor.status === 'active' ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteOpen(true)}
              disabled={loading}
              title="Delete"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete monitor"
        description="This will permanently delete this monitor and all its change history. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        loading={loading}
      />
    </>
  );
}
