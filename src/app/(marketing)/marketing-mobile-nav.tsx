'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const NAV_LINKS = [
  { href: '/use-cases', label: 'Use Cases' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#compare', label: 'Compare' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
];

export function MarketingMobileNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" />
        }
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-48">
        {NAV_LINKS.map((link) => (
          <DropdownMenuItem
            key={link.href}
            render={
              link.href.startsWith('#') ? (
                <a href={link.href} />
              ) : (
                <Link href={link.href} />
              )
            }
          >
            {link.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {isLoggedIn ? (
          <DropdownMenuItem render={<Link href="/dashboard" />}>
            Dashboard
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem render={<Link href="/login" />}>
            Log in
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
