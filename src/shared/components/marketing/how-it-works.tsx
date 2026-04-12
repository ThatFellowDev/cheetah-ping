'use client';

import { ScrollReveal } from '@/shared/components/motion-wrapper';
import { motion } from 'motion/react';
import {
  MousePointer,
  Target,
  Mail,
  MessageSquare,
  Hash,
  ChevronRight,
} from 'lucide-react';

const defaultSteps = [
  {
    icon: MousePointer,
    number: '01',
    title: 'Paste any URL',
    description: 'Copy the link to any public webpage. A careers page, a product listing, an appointment portal - anything.',
  },
  {
    icon: Target,
    number: '02',
    title: 'We start watching',
    description: 'Cheetah Ping checks the page on your schedule. Every minute, every 5 minutes, every hour - you choose. No browser extension needed.',
  },
  {
    icon: Mail,
    number: '03',
    title: 'Get pinged instantly',
    description: "Email, Slack, or Discord - your choice. The moment we detect a change, you know. While everyone else is still refreshing.",
    showChannelIcons: true,
  },
];

export function HowItWorks({
  descriptionOverrides,
}: {
  descriptionOverrides?: { step1?: string; step2?: string; step3?: string };
} = {}) {
  const steps = defaultSteps.map((step, i) => {
    const overrideKey = `step${i + 1}` as 'step1' | 'step2' | 'step3';
    return {
      ...step,
      description: descriptionOverrides?.[overrideKey] ?? step.description,
    };
  });

  return (
    <section className="py-20 border-t border-white/5 scroll-mt-16" id="how-it-works">
      <div className="mx-auto max-w-3xl px-4">
        <ScrollReveal>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4">
            Three steps. <span className="gradient-text">Under a minute.</span>
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-md mx-auto">
            No downloads. No browser extensions. No complicated setup.
          </p>
        </ScrollReveal>

        <div className="space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 relative">
          {/* Connecting line */}
          <div className="hidden sm:block absolute top-10 left-[16%] right-[16%] h-px overflow-hidden">
            <motion.div
              className="h-full w-full bg-gradient-to-r from-primary/50 via-primary/30 to-primary/50"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
              style={{ transformOrigin: 'left' }}
            />
          </div>

          {/* Flow arrows */}
          <div className="hidden sm:block absolute top-8 left-[33%] -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              <ChevronRight className="h-5 w-5 text-primary/40" />
            </motion.div>
          </div>
          <div className="hidden sm:block absolute top-8 left-[66%] -translate-x-1/2">
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.1 }}
            >
              <ChevronRight className="h-5 w-5 text-primary/40" />
            </motion.div>
          </div>

          {steps.map((step, i) => (
            <ScrollReveal key={step.title} delay={i * 0.25} direction="left">
              <div className="text-center relative">
                <motion.div
                  className="mx-auto w-20 h-20 rounded-2xl glass glow-border flex flex-col items-center justify-center mb-5"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <span className="text-xs text-primary/60 font-mono">{step.number}</span>
                  <step.icon className="h-6 w-6 text-primary" />
                </motion.div>
                <h3 className="font-heading font-semibold text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
                {step.showChannelIcons && (
                  <div className="flex items-center justify-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-full px-2.5 py-1">
                      <Mail className="h-3 w-3 text-primary" />
                      Email
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-full px-2.5 py-1">
                      <MessageSquare className="h-3 w-3 text-primary" />
                      Slack
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground glass rounded-full px-2.5 py-1">
                      <Hash className="h-3 w-3 text-primary" />
                      Discord
                    </div>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
