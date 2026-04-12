import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollReveal, GlowButton } from '@/shared/components/motion-wrapper';
import { Marquee, MarqueeItem } from '@/shared/components/marquee';
import { TiltCard } from '@/shared/components/tilt-card';
import { ParticleNetwork } from '@/shared/components/particle-network';
import { SocialProofCounter } from './social-proof-counter';
import { LiveDemo } from '@/shared/components/marketing/live-demo';
import { FaqItem } from '@/shared/components/marketing/faq-item';
import { PricingTable } from '@/shared/components/marketing/pricing-table';
import { HowItWorks } from '@/shared/components/marketing/how-it-works';
import { BottomCta } from '@/shared/components/marketing/bottom-cta';
import {
  Briefcase,
  Building2,
  Globe,
  ShoppingCart,
  ArrowRight,
  Zap,
  TrendingDown,
  Eye,
  Bell,
  Clock,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Cheetah Ping - Website Change Monitor',
  description:
    'Paste a link. Get alerted when it changes. Track price drops, restocks, job postings, and more on any website. Checks every minute. Free to start.',
};

const useCases = [
  {
    icon: TrendingDown,
    title: 'Price drop hunters',
    pain: "You've been checking that product page every day hoping the price drops. It did drop - last Tuesday. For 6 hours. You missed it.",
    solution: "We'll catch every price change the moment it happens. On any website, not just Amazon.",
  },
  {
    icon: ShoppingCart,
    title: 'Restock hunters',
    pain: "Sold out. Again. You've been checking every day for two weeks. By the time you see it's back, it's sold out again.",
    solution: "We watch the page 24/7. You'll know the second it's available.",
  },
  {
    icon: Briefcase,
    title: 'Job seekers',
    pain: "You've been refreshing that careers page 10 times a day. The perfect role will get 200 applications in the first hour.",
    solution: "We'll ping you the second it's posted. You apply first.",
  },
  {
    icon: Globe,
    title: 'Visa applicants',
    pain: "You set an alarm for 6am to check for appointment slots. They opened at 5:47am. Already gone. You've been doing this for weeks.",
    solution: 'Stop losing sleep. We check every 5 minutes and email you instantly.',
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

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How fast will I get notified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On the Ultra plan, we check every minute. The moment we detect a change, you get an email, Slack, or Discord notification. Most users get notified within 1-5 minutes.',
      },
    },
    {
      '@type': 'Question',
      name: 'What websites work with Cheetah Ping?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Any public webpage - job boards, apartment listings, e-commerce product pages, government appointment sites. The only limitation is JavaScript-heavy single-page apps.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I watch just part of a page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Use a CSS selector to monitor a specific section, or use keyword monitoring to watch for specific words appearing or disappearing.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Cheetah Ping cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Free for 5 monitors with daily checks. Starter is $9/mo for 15-minute checks, Pro is $19/mo for 5-minute checks, and Ultra is $49/mo for every-minute checks.',
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <div>
      {/* FAQ JSON-LD for this page only */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

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
              Price dropped? <span className="gradient-text">You&apos;ll know first.</span>
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

      {/* Use Cases */}
      <section className="py-20 scroll-mt-16" id="use-cases">
        <div className="mx-auto max-w-5xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-4">
              Sound <span className="gradient-text">familiar</span>?
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
              You&apos;re not the only one manually checking the same page over and over. Here&apos;s how people like you use Cheetah Ping.
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

      {/* How it Works */}
      <HowItWorks />

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
                    {comparisonData.map((row) => (
                      <tr key={row.feature} className="border-b border-white/5 last:border-0">
                        <td className="py-3 px-4 text-muted-foreground">{row.feature}</td>
                        <td className={`py-3 px-4 text-center font-medium ${row.cheetahWins ? 'text-primary' : ''}`}>
                          {row.cheetah}
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{row.visualping}</td>
                        <td className="py-3 px-4 text-center text-muted-foreground">{row.distill}</td>
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
      <PricingTable />

      {/* FAQ */}
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
      <BottomCta />
    </div>
  );
}
