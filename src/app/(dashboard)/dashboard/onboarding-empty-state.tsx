'use client';

import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart, Briefcase, Globe, TrendingDown, Eye, Bell,
  CalendarCheck, Building2, Newspaper, Package, Ticket, GraduationCap,
} from 'lucide-react';
import type { Plan } from '@/lib/plan-limits';
import { PLAN_LIMITS, PLAN_DISPLAY } from '@/lib/plan-limits';
import { MonitorForm } from '../monitors/new/monitor-form';

const USE_CASES = [
  { icon: TrendingDown, title: 'Price drops', description: 'Get alerted when a product drops in price' },
  { icon: ShoppingCart, title: 'Restock alerts', description: 'Know the moment sold-out items are back' },
  { icon: Briefcase, title: 'Job postings', description: 'Never miss new listings on careers pages' },
  { icon: Globe, title: 'Visa appointments', description: 'Monitor embassy pages for open slots' },
  { icon: Eye, title: 'Competitor pricing', description: 'Track when competitors change their prices' },
  { icon: Building2, title: 'Real estate', description: 'Watch for new listings or price changes' },
  { icon: CalendarCheck, title: 'Event registrations', description: 'Get notified when signups open' },
  { icon: Newspaper, title: 'News & press', description: 'Track company announcements and PR' },
  { icon: Package, title: 'Shipping updates', description: 'Monitor tracking pages for delivery status' },
  { icon: Ticket, title: 'Ticket drops', description: 'Catch new releases or resale price drops' },
  { icon: Bell, title: 'Policy changes', description: 'Watch terms of service or policy pages' },
  { icon: GraduationCap, title: 'Course openings', description: 'Get notified when enrollment opens' },
];

const SAMPLE_ALERTS = [
  {
    label: 'Sony WH-1000XM5',
    time: '2 min ago',
    summary: <>The price dropped from <span className="line-through">$349.99</span> to <span className="text-green-400 font-medium">$248.00</span> — a 29% discount.</>,
  },
  {
    label: 'Nike Dunk Low Panda',
    time: '18 min ago',
    summary: <>The status changed from &quot;Sold Out&quot; to <span className="text-green-400 font-medium">&quot;Add to Cart&quot;</span> — item is back in stock.</>,
  },
  {
    label: 'Stripe Careers - Engineering',
    time: '1 hr ago',
    summary: <>A new position was added: <span className="text-amber-400 font-medium">&quot;Senior Full-Stack Engineer, Payments&quot;</span> in San Francisco.</>,
  },
];

const STEPS = [
  { num: 1, label: 'Paste a URL', active: true },
  { num: 2, label: 'AI configures it', active: false },
  { num: 3, label: 'Get alerts', active: false },
];

export function OnboardingEmptyState({ plan }: { plan: Plan }) {
  const limits = PLAN_LIMITS[plan];
  const display = PLAN_DISPLAY[plan];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3"
      >
        <h1 className="font-heading text-3xl font-bold">
          Welcome to <span className="gradient-text">Cheetah Ping</span>
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Set up your first monitor in under 60 seconds. Just paste a URL and our AI handles the rest.
        </p>
      </motion.div>

      {/* Progress steps */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex justify-center gap-2"
      >
        {STEPS.map((step, i) => (
          <div key={step.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              step.active
                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-muted/30 text-muted-foreground border border-transparent'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                step.active ? 'bg-amber-500 text-black' : 'bg-muted text-muted-foreground'
              }`}>
                {step.num}
              </span>
              {step.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-8 h-px bg-muted-foreground/20" />
            )}
          </div>
        ))}
      </motion.div>

      {/* Inline monitor form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <MonitorForm plan={plan} />
      </motion.div>

      {/* Use case inspiration grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground text-center">Ideas for what to monitor</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {USE_CASES.map((uc) => (
            <div key={uc.title} className="glass rounded-xl py-3 px-3.5 space-y-1 border-0">
              <div className="flex items-center gap-2">
                <uc.icon className="h-3.5 w-3.5 text-amber-400/70" />
                <span className="text-xs font-medium">{uc.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{uc.description}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Sample alerts */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="space-y-3"
      >
        <h3 className="text-sm font-medium text-muted-foreground text-center">What you'll get</h3>
        <div className="space-y-2">
          {SAMPLE_ALERTS.map((alert) => (
            <Card key={alert.label} className="glass border-0 overflow-hidden">
              <CardContent className="py-3.5 px-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 shrink-0 animate-pulse" />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Change detected</span>
                      <span className="text-xs text-muted-foreground">{alert.time}</span>
                    </div>
                    <p className="text-sm text-amber-400/90">{alert.label}</p>
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5 leading-relaxed">
                      {alert.summary}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground/50 text-center">
          AI-powered summaries tell you exactly what changed, in plain English.
        </p>
      </motion.div>

      {/* Plan info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="text-center text-xs text-muted-foreground/50 pb-4"
      >
        You're on the <span className="text-muted-foreground">{display.name}</span> plan — {limits.maxMonitors} monitors, checks every {limits.minIntervalMinutes >= 60 ? `${limits.minIntervalMinutes / 60}h` : limits.minIntervalMinutes === 1 ? 'minute' : `${limits.minIntervalMinutes}m`}
      </motion.div>
    </div>
  );
}
