'use client';

import { LinkButton } from '@/shared/components/link-button';
import { motion } from 'motion/react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      {actionLabel && actionHref && (
        <LinkButton
          href={actionHref}
          className="mt-4 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground border-0 hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow"
        >
          {actionLabel}
        </LinkButton>
      )}
    </motion.div>
  );
}
