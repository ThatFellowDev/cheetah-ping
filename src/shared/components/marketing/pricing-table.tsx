'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal, GlowButton } from '@/shared/components/motion-wrapper';
import { TiltCard } from '@/shared/components/tilt-card';
import { Check } from 'lucide-react';
import { plans } from '@/shared/content/pricing';

export function PricingTable({ ctaBase = '/login' }: { ctaBase?: string }) {
  return (
    <section className="py-20 border-t border-white/5 scroll-mt-16" id="pricing">
      <div className="mx-auto max-w-4xl px-4">
        <ScrollReveal>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4">
            Simple, <span className="gradient-text">honest</span> pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
            No surprises. No per-seat pricing. Cancel anytime with one click.
          </p>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.1}>
              <TiltCard className="h-full" tiltAmount={5}>
                <Card
                  className={`glass h-full border-0 ${
                    plan.highlighted ? 'glow-border' : ''
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
                      {plan.badge && (
                        <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-primary border-primary/30">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{plan.subtitle}</p>
                    <div className="mb-3">
                      <span className="font-heading text-3xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                    <p className="text-xs text-primary/80 mb-4 font-medium">
                      {plan.valueProp}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Link href={ctaBase} className="block">
                      {plan.highlighted ? (
                        <GlowButton className="w-full">{plan.cta}</GlowButton>
                      ) : (
                        <button className="w-full h-9 px-4 rounded-xl text-sm font-medium glass glass-hover text-foreground transition-all">
                          {plan.cta}
                        </button>
                      )}
                    </Link>
                  </CardContent>
                </Card>
              </TiltCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
