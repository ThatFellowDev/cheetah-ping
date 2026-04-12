'use client';

import { useState } from 'react';
import { ScrollReveal } from '@/shared/components/motion-wrapper';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <ScrollReveal delay={index * 0.08}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left glass glass-hover rounded-xl p-4 transition-all"
      >
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <h3 className="font-semibold">{q}</h3>
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </ScrollReveal>
  );
}
