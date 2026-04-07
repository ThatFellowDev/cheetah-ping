'use client';

import { useRouter } from 'next/navigation';
import { authClient } from '@/modules/auth/auth-client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-200"
    >
      Log out
    </button>
  );
}
