'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/shared/components/status-badge';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ExternalLink,
  Pause,
  Play,
  Trash2,
  Clock,
  AlertTriangle,
  Pencil,
  Check,
  X,
  Crosshair,
  Share2,
  Copy,
} from 'lucide-react';
import { FREQUENCY_OPTIONS } from '@/lib/plan-limits';
import { SelectorPreviewPanel } from '../new/components/selector-preview-panel';

interface Monitor {
  id: string;
  url: string;
  label: string | null;
  selector: string | null;
  keyword: string | null;
  status: string;
  checkIntervalMinutes: number;
  lastCheckedAt: Date | null;
  lastChangedAt: Date | null;
  lastSnapshot: string | null;
  errorMessage: string | null;
  consecutiveErrors: number;
  shareEnabled: boolean;
  createdAt: Date;
}

interface Change {
  id: string;
  detectedAt: Date;
  diffSummary: string | null;
  aiSummary: string | null;
  previousSnapshot: string | null;
  newSnapshot: string | null;
  shareToken: string | null;
}

function formatDate(date: Date | null) {
  if (!date) return 'Never';
  return new Date(date).toLocaleString();
}

function formatFrequency(minutes: number) {
  return FREQUENCY_OPTIONS.find((f) => f.value === minutes)?.label || `Every ${minutes}m`;
}

export function MonitorDetail({
  monitor,
  changes,
}: {
  monitor: Monitor;
  changes: Change[];
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(monitor.label || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingSelector, setEditingSelector] = useState(false);
  const [editSelector, setEditSelector] = useState(monitor.selector || '');
  const [savingSelector, setSavingSelector] = useState(false);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  async function handleSaveLabel() {
    setSaving(true);
    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLabel || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('Label updated');
      setEditing(false);
      router.refresh();
    } catch {
      toast.error('Failed to update label');
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditLabel(monitor.label || '');
    setEditing(false);
  }

  async function handleSaveSelector() {
    setSavingSelector(true);
    try {
      const res = await fetch(`/api/monitors/${monitor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: editSelector || null }),
      });
      if (!res.ok) throw new Error();
      toast.success('CSS selector updated');
      setEditingSelector(false);
      router.refresh();
    } catch {
      toast.error('Failed to update selector');
    } finally {
      setSavingSelector(false);
    }
  }

  function handleCancelSelectorEdit() {
    setEditSelector(monitor.selector || '');
    setEditingSelector(false);
  }

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
      router.push('/dashboard');
    } catch {
      toast.error('Failed to delete monitor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }))}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {editing ? (
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  ref={inputRef}
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveLabel();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  placeholder="Monitor label"
                  className="font-heading text-2xl font-bold bg-transparent border-b-2 border-primary/50 outline-none flex-1 min-w-0 py-0.5"
                  disabled={saving}
                />
                <button
                  onClick={handleSaveLabel}
                  disabled={saving}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-primary transition-all"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="group flex items-center gap-2 hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-all"
              >
                <h1 className="font-heading text-2xl font-bold truncate">
                  {monitor.label || 'Untitled Monitor'}
                </h1>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
            <StatusBadge status={monitor.status} />
          </div>
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {monitor.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" onClick={handleToggle} disabled={loading}>
            {monitor.status === 'active' ? (
              <>
                <Pause className="mr-2 h-4 w-4" /> Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Resume
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            disabled={loading}
          >
            <Trash2 className="mr-2 h-4 w-4 text-destructive" /> Delete
          </Button>
        </div>
      </div>

      {monitor.status === 'error' && monitor.errorMessage && (
        <Card className="glass border-0 border-l-2 border-l-destructive/50">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Monitor error</p>
              <p className="text-sm text-muted-foreground mt-1">
                {monitor.errorMessage}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {monitor.consecutiveErrors} consecutive errors
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">URL</span>
            <span className="truncate max-w-xs">{monitor.url}</span>
          </div>
          {monitor.label && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Label</span>
              <span>{monitor.label}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Check frequency</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatFrequency(monitor.checkIntervalMinutes)}
            </span>
          </div>
          {(monitor.selector || editingSelector) && (
            <div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">CSS Selector</span>
                {!editingSelector ? (
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {monitor.selector}
                    </code>
                    <button
                      onClick={() => setEditingSelector(true)}
                      className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleSaveSelector}
                      disabled={savingSelector}
                      className="p-1 rounded hover:bg-white/10 text-primary transition-all"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={handleCancelSelectorEdit}
                      disabled={savingSelector}
                      className="p-1 rounded hover:bg-white/10 text-muted-foreground transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              {editingSelector && (
                <div className="mt-2">
                  <SelectorPreviewPanel
                    url={monitor.url}
                    value={editSelector}
                    onChange={setEditSelector}
                  />
                </div>
              )}
            </div>
          )}
          {monitor.keyword && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Keyword</span>
              <span>"{monitor.keyword}"</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Share2 className="h-3.5 w-3.5" />
              Shareable links
            </span>
            <button
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/monitors/${monitor.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ shareEnabled: !monitor.shareEnabled }),
                  });
                  if (!res.ok) throw new Error();
                  toast.success(monitor.shareEnabled ? 'Sharing disabled' : 'Sharing enabled');
                  router.refresh();
                } catch {
                  toast.error('Failed to update sharing');
                }
              }}
              className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                monitor.shareEnabled
                  ? 'bg-primary/20 text-primary hover:bg-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
              title={monitor.shareEnabled ? 'Click to disable sharing' : 'Click to enable shareable links for changes'}
            >
              {monitor.shareEnabled ? 'On' : 'Off'}
            </button>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last checked</span>
            <span>{formatDate(monitor.lastCheckedAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last changed</span>
            <span>{formatDate(monitor.lastChangedAt)}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass border-0">
        <CardHeader>
          <CardTitle className="text-base">Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {changes.length === 0 ? (
            <div className="py-8 space-y-6">
              <div className="flex items-start gap-4 max-w-sm mx-auto">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    monitor.lastCheckedAt ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'
                  }`}>
                    {monitor.lastCheckedAt ? <Check className="h-4 w-4" /> : '1'}
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/20">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-muted text-muted-foreground text-xs font-bold">
                    3
                  </div>
                </div>
                <div className="space-y-5 pt-1">
                  <div>
                    <p className={`text-sm font-medium ${monitor.lastCheckedAt ? 'text-green-400' : 'text-muted-foreground'}`}>
                      {monitor.lastCheckedAt ? 'First check complete' : 'Waiting for first check'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {monitor.lastCheckedAt ? 'Page snapshot captured' : 'Starting soon...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-400">Watching for changes...</p>
                    <p className="text-xs text-muted-foreground">
                      Checking {formatFrequency(monitor.checkIntervalMinutes).toLowerCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">You'll be notified</p>
                    <p className="text-xs text-muted-foreground">Via email the moment something changes</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {changes.map((change) => (
                <div key={change.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(change.detectedAt)}
                    </span>
                    {monitor.shareEnabled && change.shareToken && (
                      <button
                        type="button"
                        onClick={() => {
                          const shareUrl = `${window.location.origin}/changes/${change.shareToken}`;
                          navigator.clipboard.writeText(shareUrl);
                          toast.success('Share link copied!');
                        }}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        Share
                      </button>
                    )}
                  </div>
                  {change.aiSummary && (
                    <p className="text-sm font-medium">{change.aiSummary}</p>
                  )}
                  {change.diffSummary && (
                    <p className={`text-sm ${change.aiSummary ? 'text-xs text-muted-foreground mt-1' : ''}`}>{change.diffSummary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
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
    </div>
  );
}
