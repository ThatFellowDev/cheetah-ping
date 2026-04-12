import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { USE_CASES, getUseCaseBySlug } from '@/shared/content/use-cases';
import { ScrollReveal, GlowButton } from '@/shared/components/motion-wrapper';
import { ParticleNetwork } from '@/shared/components/particle-network';
import { SocialProofCounter } from '../../social-proof-counter';
import { HowItWorks } from '@/shared/components/marketing/how-it-works';
import { PricingTable } from '@/shared/components/marketing/pricing-table';
import { FaqItem } from '@/shared/components/marketing/faq-item';
import { BottomCta } from '@/shared/components/marketing/bottom-cta';
import { ArrowRight, Check, Zap } from 'lucide-react';
import { UseCaseIcon } from './use-case-icon';

export function generateStaticParams() {
  return USE_CASES.map((uc) => ({ slug: uc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) return {};

  return {
    title: useCase.seo.title,
    description: useCase.seo.description,
    openGraph: {
      title: useCase.seo.title,
      description: useCase.seo.description,
      type: 'website',
    },
    alternates: {
      canonical: `https://cheetahping.com/use-cases/${slug}`,
    },
  };
}

export default async function UseCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) notFound();

  const relatedCases = useCase.relatedSlugs
    .map((s) => getUseCaseBySlug(s))
    .filter(Boolean);

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://cheetahping.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Use Cases',
        item: 'https://cheetahping.com/use-cases',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: useCase.hero.headline,
        item: `https://cheetahping.com/use-cases/${slug}`,
      },
    ],
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: useCase.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  const ctaHref = `/login?callbackURL=${encodeURIComponent(
    `/monitors/new?url=${encodeURIComponent(useCase.hero.exampleUrl)}`
  )}&src=${slug}`;

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="relative py-24 sm:py-36 overflow-hidden">
        <ParticleNetwork
          particleCount={70}
          connectionDistance={130}
          mouseRadius={200}
          color={useCase.accentColor}
        />

        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-xs text-muted-foreground mb-6">
              <UseCaseIcon name={useCase.iconName} className="h-3.5 w-3.5 text-primary" />
              {useCase.hero.eyebrow}
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              {(() => {
                const idx = useCase.hero.headline.indexOf(useCase.hero.headlineAccent);
                if (idx === -1) return useCase.hero.headline;
                const before = useCase.hero.headline.slice(0, idx);
                const after = useCase.hero.headline.slice(idx + useCase.hero.headlineAccent.length);
                return (
                  <>
                    {before}
                    <span className="gradient-text">{useCase.hero.headlineAccent}</span>
                    {after}
                  </>
                );
              })()}
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {useCase.hero.subheadline}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href={ctaHref}>
                <GlowButton size="lg">
                  Start monitoring - free
                  <ArrowRight className="h-4 w-4" />
                </GlowButton>
              </Link>
              <p className="text-sm text-muted-foreground">
                e.g. {useCase.hero.exampleLabel}
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pain Story */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-6">
              {useCase.pain.title}
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <div className="prose prose-sm text-muted-foreground leading-relaxed space-y-4">
              {useCase.pain.story.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold mb-8">
              {useCase.solution.title}
            </h2>
          </ScrollReveal>
          <div className="space-y-4">
            {useCase.solution.bullets.map((bullet, i) => (
              <ScrollReveal key={i} delay={i * 0.08}>
                <div className="flex gap-3 items-start glass rounded-xl p-4">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm leading-relaxed">{bullet}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (reused) */}
      <HowItWorks descriptionOverrides={useCase.howItWorksOverride} />

      {/* Social Proof */}
      <section className="py-10 border-t border-white/5">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl px-4 text-center space-y-4">
            <SocialProofCounter />
            {useCase.socialProof && (
              <div className="glass rounded-xl p-6 max-w-lg mx-auto">
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  &ldquo;{useCase.socialProof.quote}&rdquo;
                </p>
                <p className="text-xs text-primary/70 mt-2">
                  {useCase.socialProof.attribution}
                </p>
              </div>
            )}
            <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5">
              <Zap className="h-4 w-4 text-primary" />
              <p className="text-sm">
                <span className="text-foreground font-medium">Unlimited checks. Every plan.</span>{' '}
                <span className="text-muted-foreground">
                  Flat-rate monitoring, no per-check billing.
                </span>
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Pricing */}
      <PricingTable ctaBase={ctaHref} />

      {/* FAQ */}
      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-center mb-12">
              Frequently asked <span className="gradient-text">questions</span>
            </h2>
          </ScrollReveal>
          <div className="space-y-3">
            {useCase.faqs.map((faq, i) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Related Use Cases */}
      {relatedCases.length > 0 && (
        <section className="py-16 border-t border-white/5">
          <div className="mx-auto max-w-3xl px-4">
            <ScrollReveal>
              <h2 className="font-heading text-xl font-bold text-center mb-8">
                Related <span className="gradient-text">use cases</span>
              </h2>
            </ScrollReveal>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {relatedCases.map((rc) => (
                <ScrollReveal key={rc!.slug}>
                  <Link
                    href={`/use-cases/${rc!.slug}`}
                    className="block glass glass-hover rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <UseCaseIcon name={rc!.iconName} className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{rc!.hero.headline}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {rc!.seo.description}
                    </p>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Bottom CTA */}
      <BottomCta
        headline={
          <>
            Start monitoring <span className="gradient-text">now</span>
          </>
        }
        description={`Set up your first ${useCase.hero.eyebrow.toLowerCase()} monitor in 30 seconds. Free forever for 5 monitors.`}
        ctaHref={ctaHref}
      />
    </div>
  );
}
