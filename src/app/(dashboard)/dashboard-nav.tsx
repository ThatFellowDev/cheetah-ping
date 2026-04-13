'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, LogOut, Settings, FileText, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/modules/auth/auth-client';

export function DashboardNav({
  email,
  isAdmin,
}: {
  email: string;
  isAdmin: boolean;
}) {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push('/login');
  }

  return (
    <div className="flex items-center justify-between flex-1 min-w-0">
      {/* Desktop nav links */}
      <nav className="hidden sm:flex items-center gap-1 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          Dashboard
        </Link>
        <Link
          href="/settings"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          Settings
        </Link>
        <Link
          href="/docs"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          Docs
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="text-primary/70 hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-all duration-200"
          >
            Admin
          </Link>
        )}
      </nav>

      {/* Desktop right side */}
      <div className="hidden sm:flex items-center gap-4">
        <span className="text-sm text-muted-foreground truncate max-w-[200px]">{email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          Log out
        </button>
      </div>

      {/* Mobile: Dashboard link + user dropdown */}
      <nav className="flex sm:hidden items-center gap-1 text-sm">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground hover:bg-white/5 px-2 py-1.5 rounded-lg transition-all duration-200"
        >
          Dashboard
        </Link>
      </nav>

      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="h-9 w-9" />
            }
          >
            <User className="h-5 w-5" />
            <span className="sr-only">User menu</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{email}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={<Link href="/settings" />}
            >
              <Settings className="h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              render={<Link href="/docs" />}
            >
              <FileText className="h-4 w-4" />
              Docs
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem
                render={<Link href="/admin" />}
              >
                <Shield className="h-4 w-4" />
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
