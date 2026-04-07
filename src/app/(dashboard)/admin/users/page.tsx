'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { toast } from 'sonner';
import { Search, Trash2, Shield, ShieldCheck, ShieldOff } from 'lucide-react';

interface UserRow {
  id: string;
  email: string;
  name: string;
  plan: string;
  isAdmin: boolean;
  createdAt: string;
  monitorCount: number;
}

const PLANS = ['free', 'starter', 'pro', 'ultra'];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchUsers() {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.data || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete');
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== deleteId));
      toast.success('User deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  async function handleChangePlan(userId: string, newPlan: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
      );
      toast.success(`Plan changed to ${newPlan}`);
    } catch {
      toast.error('Failed to change plan');
    }
  }

  async function handleToggleAdmin(userId: string, isAdmin: boolean) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAdmin: !isAdmin }),
      });
      if (!res.ok) throw new Error();
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: !isAdmin } : u))
      );
      toast.success(isAdmin ? 'Admin removed' : 'Admin granted');
    } catch {
      toast.error('Failed to update admin status');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold">Users</h1>
        <span className="text-sm text-muted-foreground">{users.length} total</span>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((u) => (
            <Card key={u.id} className="glass border-0">
              <CardContent className="py-4 px-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{u.email}</p>
                      {u.isAdmin && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{u.monitorCount} monitors</span>
                      <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Plan selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={u.plan || 'free'}
                      onValueChange={(val) => val && handleChangePlan(u.id, val)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p} value={p} className="text-xs capitalize">
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Toggle admin */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                      title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                      className="shrink-0"
                    >
                      {u.isAdmin ? (
                        <ShieldOff className="h-4 w-4 text-primary" />
                      ) : (
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(u.id)}
                      title="Delete user"
                      className="shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
          )}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete user"
        description="This will permanently delete this user and all their monitors. This cannot be undone."
        confirmLabel="Delete user"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
    </div>
  );
}
