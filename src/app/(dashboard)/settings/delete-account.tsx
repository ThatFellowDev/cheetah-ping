'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/shared/components/confirm-dialog';
import { authClient } from '@/modules/auth/auth-client';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

export function DeleteAccount() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/account', { method: 'DELETE' });
      if (!res.ok) throw new Error();

      await authClient.signOut();
      toast.success('Account deleted');
      router.push('/');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete my account
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Delete your account?"
        description="This will permanently delete your account, all monitors, and all change history. This action cannot be undone."
        confirmLabel="Delete everything"
        onConfirm={handleDelete}
        loading={loading}
        destructive
      />
    </>
  );
}
