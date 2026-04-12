'use client';

import Link from 'next/link';
import { ScrollReveal, GlowButton } from '@/shared/components/motion-wrapper';
import { ArrowRight } from 'lucide-react';

export function BottomCta({
  headline = <>Never miss a <span className="gradient-text">price drop</span> again.</>,
  description = "Set up a monitor in 30 seconds. We check every 5 minutes so you don't have to. Free forever for 5 monitors.",
  ctaText = 'Get started free',
  ctaHref = '/login',
}: {
  headline?: React.ReactNode;
  description?: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <section className="py-20 border-t border-white/5">
      <div className="mx-auto max-w-xl px-4 text-center relative">
        <ScrollReveal>
          <div className="relative glass rounded-2xl p-10">
            <h2 className="font-heading text-2xl font-bold mb-3">
              {headline}
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              {description}
            </p>
            <Link href={ctaHref}>
              <GlowButton size="lg">
                {ctaText}
                <ArrowRight className="h-4 w-4" />
              </GlowButton>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
