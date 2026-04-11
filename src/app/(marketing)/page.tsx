'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollReveal, GlowButton } from '@/shared/components/motion-wrapper';
import { Marquee, MarqueeItem } from '@/shared/components/marquee';
import { TiltCard } from '@/shared/components/tilt-card';
import { ParticleNetwork } from '@/shared/components/particle-network';
import { SocialProofCounter } from './social-proof-counter';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Building2,
  Globe,
  ShoppingCart,
  Check,
  ArrowRight,
  Zap,
  Mail,
  MousePointer,
  TrendingDown,
  Eye,
  Bell,
  Clock,
  Shield,
  ChevronDown,
  ChevronRight,
  Target,
  MessageSquare,
  Hash,
} from 'lucide-react';

const useCases = [
  {
    icon: TrendingDown,
    title: 'Price drop hunters',
    pain: "You've been checking that product page every day hoping the price drops. It did drop - last Tuesday. For 6 hours. You missed it.",
    solution: "We'll catch every price change the moment it happens. On any website, not just Amazon.",
    emoji: '💰',
  },
  {
    icon: ShoppingCart,
    title: 'Restock hunters',
    pain: "Sold out. Again. You've been checking every day for two weeks. By the time you see it's back, it's sold out again.",
    solution: "We watch the page 24/7. You'll know the second it's available.",
    emoji: '🛒',
  },
  {
    icon: Briefcase,
    title: 'Job seekers',
    pain: "You've been refreshing that careers page 10 times a day. The perfect role will get 200 applications in the first hour.",
    solution: "We'll ping you the second it's posted. You apply first.",
    emoji: '💼',
  },
  {
    icon: Globe,
    title: 'Visa applicants',
    pain: "You set an alarm for 6am to check for appointment slots. They opened at 5:47am. Already gone. You've been doing this for weeks.",
    solution: 'Stop losing sleep. We check every 5 minutes and email you instantly.',
    emoji: '✈️',
  },
];

const steps = [
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

const plans = [
  {
    name: 'Free',
    subtitle: 'Track a few prices',
    price: '$0',
    period: '/mo',
    valueProp: '~150 checks/month on autopilot',
    features: ['5 monitors', 'Unlimited checks', 'Every 24 hours', '7 days history'],
    cta: 'Start for free',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Starter',
    subtitle: 'For serious deal hunters',
    price: '$9',
    period: '/mo',
    valueProp: '~28,800 checks/month on autopilot',
    features: ['10 monitors', 'Unlimited checks', 'Every 15 minutes', '30 days history'],
    cta: 'Get started',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    subtitle: 'For power users',
    price: '$19',
    period: '/mo',
    valueProp: '~432,000 checks/month on autopilot',
    features: ['50 monitors', 'Unlimited checks', 'Every 5 minutes', '90 days history'],
    cta: 'Go pro',
    highlighted: true,
    badge: 'Most popular',
  },
  {
    name: 'Ultra',
    subtitle: "Can't miss a beat",
    price: '$49',
    period: '/mo',
    valueProp: '~2.16M checks/month. Nothing slips past you.',
    features: ['50 monitors', 'Unlimited checks', 'Every minute', '180 days history'],
    cta: 'Go ultra',
    highlighted: false,
    badge: 'Fastest',
  },
];

const faqs = [
  {
    q: "Can I track prices on any website?",
    a: "Yes. Unlike Amazon-only tools like CamelCamelCamel or Keepa, Cheetah Ping works on any website. Monitor prices on niche stores, international retailers, direct-to-consumer brands - anywhere with a public product page. Our AI even auto-detects the price element for you.",
  },
  {
    q: "How fast will I get notified?",
    a: "On the Ultra plan, we check every minute. The moment we detect a change, you get an email, Slack, or Discord alert. Most users get notified within minutes of a real change. Compare that to checking manually and missing things for hours or days.",
  },
  {
    q: "What kind of websites work?",
    a: "Any public webpage. Product pages, job boards, government appointment sites, competitor pricing, event ticket pages - if you can see it in a browser, we can watch it. The only exception: some JavaScript-heavy apps that don't render server-side.",
  },
  {
    q: "Can I watch just one part of a page?",
    a: "Yes. You can target a specific element - like a price tag, a job listings section, or a stock status. We also support keyword monitoring: watch for \"In Stock\" or \"Available\" and get alerted only when that word appears or disappears.",
  },
  {
    q: "How is this different from browser extensions?",
    a: "Browser extensions only work when your computer is on and the browser is open. Cheetah Ping runs in the cloud 24/7 - we check pages even while you sleep. Plus our AI auto-configures everything, so you don't have to manually set up selectors.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Instantly. No contracts, no cancellation fees. Click one button and you're done. Your monitors just move to the free plan.",
  },
];

const marqueeItems = [
  { icon: TrendingDown, text: 'Price drops' },
  { icon: ShoppingCart, text: 'Restock alerts' },
  { icon: Briefcase, text: 'Job postings' },
  { icon: Globe, text: 'Visa appointments' },
  { icon: Eye, text: 'Competitor pricing' },
  { icon: Bell, text: 'Product launches' },
  { icon: Clock, text: 'Event tickets' },
  { icon: Shield, text: 'Sale announcements' },
  { icon: Building2, text: 'Inventory changes' },
];

const comparisonData = [
  { feature: 'AI-powered setup', cheetah: 'Included (auto-configures)', visualping: 'No', distill: 'No', cheetahWins: true },
  { feature: 'AI change summaries', cheetah: 'Included free', visualping: 'Premium AI (extra cost)', distill: 'No', cheetahWins: true },
  { feature: 'Check limits', cheetah: 'Unlimited', visualping: '150-50K/mo', distill: '1K-200K/mo', cheetahWins: true },
  { feature: 'Starting price', cheetah: '$9/mo (10 monitors)', visualping: '$14/mo (10 pages)', distill: '$15/mo (50 monitors)', cheetahWins: true },
  { feature: 'Slack + Discord', cheetah: 'All plans', visualping: 'Business ($140/mo)', distill: 'Paid plans', cheetahWins: true },
  { feature: 'Setup time', cheetah: '~30 seconds (AI)', visualping: '2-5 minutes', distill: '3-5 minutes', cheetahWins: true },
  { feature: 'Pricing model', cheetah: 'Simple flat rate', visualping: 'Per-check billing', distill: 'Per-check billing', cheetahWins: true },
];

function LiveDemo() {
  const [phase, setPhase] = useState<'watching' | 'detected' | 'sent'>('watching');
  const [dots, setDots] = useState('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    function cycle() {
      setPhase('watching');
      setDots('');

      // Animate dots
      const dotTimers = [
        setTimeout(() => setDots('.'), 800),
        setTimeout(() => setDots('..'), 1600),
        setTimeout(() => setDots('...'), 2400),
      ];

      // Change detected
      timeout = setTimeout(() => {
        setPhase('detected');
        // Email sent
        setTimeout(() => {
          setPhase('sent');
          // Reset
          setTimeout(cycle, 2500);
        }, 1200);
      }, 3200);

      return () => {
        dotTimers.forEach(clearTimeout);
        clearTimeout(timeout);
      };
    }

    const cleanup = cycle();
    return () => { cleanup?.(); clearTimeout(timeout); };
  }, []);

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5 font-mono text-sm">
        <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          phase === 'watching' ? 'bg-primary animate-pulse' :
          phase === 'detected' ? 'bg-amber-400' :
          'bg-emerald-400'
        }`} />
        <span className={`transition-colors duration-300 ${
          phase === 'sent' ? 'text-emerald-400' : 'text-muted-foreground'
        }`}>
          {phase === 'watching' && `Checking page${dots}`}
          {phase === 'detected' && 'Change detected!'}
          {phase === 'sent' && 'Alert sent to your inbox'}
        </span>
      </div>
    </div>
  );
}

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
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

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 sm:py-36 overflow-hidden">
        <ParticleNetwork
          particleCount={90}
          connectionDistance={140}
          mouseRadius={220}
          color={[234, 179, 8]}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Price dropped? <span className="gradient-text">You'll know first.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="mt-6">
              <LiveDemo />
            </div>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Track price drops, restocks, job postings, and more on any website.
              Get alerted the second something changes. Not tomorrow - right now.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/login">
                <GlowButton size="lg">
                  Start watching - free
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </Link>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              No credit card. 5 free monitors. Live in 30 seconds.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Marquee */}
      <section className="py-4 border-y border-white/5">
        <Marquee speed={35}>
          {marqueeItems.map((item) => (
            <MarqueeItem key={item.text}>
              <item.icon className="h-4 w-4 text-primary" />
              {item.text}
            </MarqueeItem>
          ))}
        </Marquee>
      </section>

      {/* Use Cases - empathy-driven */}
      <section className="py-20 scroll-mt-16" id="use-cases">
        <div className="mx-auto max-w-5xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4">
              Sound <span className="gradient-text">familiar</span>?
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
              You're not the only one manually checking the same page over and over. Here's how people like you use Cheetah Ping.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-5">
            {useCases.map((uc, i) => (
              <ScrollReveal key={uc.title} delay={i * 0.1}>
                <TiltCard className="h-full">
                  <Card className="glass glass-hover h-full border-0">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <uc.icon className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-heading font-semibold text-lg">{uc.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                        {uc.pain}
                      </p>
                      <p className="text-sm font-medium text-primary/90 leading-relaxed">
                        {uc.solution}
                      </p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - more visual */}
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
            {/* Connecting line - draws left to right */}
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

            {/* Flow arrows between steps (desktop) */}
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
                  {(step as any).showChannelIcons && (
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

      {/* Social proof */}
      <section className="py-10 border-t border-white/5">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
            <SocialProofCounter />
            <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm">
                <span className="text-foreground font-medium">Unlimited checks. Every plan.</span>{' '}
                <span className="text-muted-foreground">
                  No check limits, no surprises. Just flat-rate monitoring on any website.
                </span>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Comparison Table */}
      <section className="py-20 border-t border-white/5 scroll-mt-16" id="compare">
        <div className="mx-auto max-w-4xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4">
              How we <span className="gradient-text">compare</span>
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
              See how we stack up against the industry leaders.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Feature</th>
                      <th className="text-center py-3 px-4 font-semibold gradient-text">Cheetah Ping</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Visualping</th>
                      <th className="text-center py-3 px-4 font-medium text-muted-foreground">Distill.io</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((row, i) => (
                      <tr key={row.feature} className="border-b border-white/5 last:border-0">
                        <td className="py-3 px-4 text-muted-foreground">{row.feature}</td>
                        <td className={`py-3 px-4 text-center font-medium ${row.cheetahWins ? 'text-primary' : ''}`}>
                          {row.cheetah}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{row.visualping}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{(row as any).distill}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing */}
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
                      {(plan as any).subtitle && (
                        <p className="text-xs text-muted-foreground mb-2">{(plan as any).subtitle}</p>
                      )}
                      <div className="mb-3">
                        <span className="font-heading text-3xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      {(plan as any).valueProp && (
                        <p className="text-xs text-primary/80 mb-4 font-medium">
                          {(plan as any).valueProp}
                        </p>
                      )}
                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check className="h-4 w-4 text-primary shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/login" className="block">
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

      {/* FAQ - accordion style */}
      <section className="py-20 border-t border-white/5 scroll-mt-16" id="faq">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12">
              Got <span className="gradient-text">questions</span>?
            </h2>
          </ScrollReveal>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-xl px-4 text-center relative">
          <ScrollReveal>
            <div className="relative glass rounded-2xl p-10">
              <h2 className="font-heading text-2xl font-bold mb-3">
                Never miss a <span className="gradient-text">price drop</span> again.
              </h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Set up a monitor in 30 seconds. We check every 5 minutes so you don't
                have to. Free forever for 5 monitors.
              </p>
              <Link href="/login">
                <GlowButton size="lg">
                  Get started free
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
