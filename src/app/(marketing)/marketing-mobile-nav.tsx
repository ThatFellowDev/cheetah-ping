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
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

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
        <DropdownMenuItem render={<Link href="/use-cases" />}>
          Use Cases
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/use-cases#personal" />} className="pl-6 text-muted-foreground">
          Personal
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/use-cases#business" />} className="pl-6 text-muted-foreground">
          Business
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/use-cases#industry" />} className="pl-6 text-muted-foreground">
          Industry
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<a href="#how-it-works" />}>
          How It Works
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href="#compare" />}>
          Compare
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href="#pricing" />}>
          Pricing
        </DropdownMenuItem>
        <DropdownMenuItem render={<a href="#faq" />}>
          FAQ
        </DropdownMenuItem>
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
