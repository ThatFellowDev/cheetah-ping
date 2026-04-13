import type { Metadata } from 'next';
import Link from 'next/link';
import { USE_CASES } from '@/shared/content/use-cases';
import { ScrollReveal } from '@/shared/components/motion-wrapper';
import { ParticleNetwork } from '@/shared/components/particle-network';
import { LinkButton } from '@/shared/components/link-button';
import { UseCaseIcon } from './[slug]/use-case-icon';

export const metadata: Metadata = {
  title: 'Use Cases',
  description:
    'See how people use Cheetah Ping to track price drops, restock alerts, visa appointments, job postings, competitor changes, and more.',
  alternates: {
    canonical: 'https://cheetahping.com/use-cases',
  },
};

const categories = [
  { key: 'personal' as const, label: 'Personal', description: 'For individuals watching pages that matter to them' },
  { key: 'business' as const, label: 'Business', description: 'For teams tracking competitive and operational intelligence' },
  { key: 'industry' as const, label: 'Industry', description: 'For professionals in regulated or fast-moving sectors' },
];

export default function UseCasesIndexPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <ParticleNetwork
          particleCount={60}
          connectionDistance={120}
          mouseRadius={180}
          color={[234, 179, 8]}
        />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
              One tool, <span className="gradient-text">endless uses</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              If it has a URL, Cheetah Ping can watch it. See how people
              across industries use it to stay ahead.
            </p>
            <div className="mt-8">
              <LinkButton
                href="/login"
                size="lg"
                className="bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-primary-foreground hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_30%)] transition-shadow border-0"
              >
                Get started free
              </LinkButton>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Categories */}
      {categories.map((cat) => {
        const items = USE_CASES.filter((uc) => uc.category === cat.key);
        return (
          <section key={cat.key} id={cat.key} className="py-16 border-t border-white/5 scroll-mt-16">
            <div className="mx-auto max-w-5xl px-4">
              <ScrollReveal>
                <h2 className="font-heading text-2xl font-bold mb-2">
                  {cat.label}
                </h2>
                <p className="text-muted-foreground text-sm mb-8">
                  {cat.description}
                </p>
              </ScrollReveal>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((uc, i) => (
                  <ScrollReveal key={uc.slug} delay={i * 0.05}>
                    <Link
                      href={`/use-cases/${uc.slug}`}
                      className="block glass glass-hover rounded-xl p-5 transition-all h-full"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `rgba(${uc.accentColor.join(',')}, 0.1)`,
                          }}
                        >
                          <UseCaseIcon
                            name={uc.iconName}
                            className="h-4.5 w-4.5"
                            style={{ color: `rgb(${uc.accentColor.join(',')})` }}
                          />
                        </div>
                        <h3 className="font-heading font-semibold text-sm">
                          {uc.hero.headline}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {uc.hero.subheadline}
                      </p>
                    </Link>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
