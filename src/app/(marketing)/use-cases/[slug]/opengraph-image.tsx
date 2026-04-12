import { ImageResponse } from 'next/og';
import { getUseCaseBySlug } from '@/shared/content/use-cases';

export const alt = 'Cheetah Ping Use Case';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  const headline = useCase?.hero.headline ?? 'Website Change Monitor';
  const eyebrow = useCase?.hero.eyebrow ?? '';
  const [r, g, b] = useCase?.accentColor ?? [234, 179, 8];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: `linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, rgba(${r},${g},${b},0.15) 100%)`,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            width: '80px',
            height: '4px',
            background: `rgb(${r},${g},${b})`,
            marginBottom: '24px',
            borderRadius: '2px',
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            fontSize: '20px',
            color: `rgb(${r},${g},${b})`,
            marginBottom: '16px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: '900px',
          }}
        >
          {headline}
        </div>

        {/* Bottom brand */}
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '80px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              background: `linear-gradient(90deg, rgb(${r},${g},${b}), rgb(249,115,22))`,
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Cheetah Ping
          </div>
          <div
            style={{
              fontSize: '18px',
              color: '#a0a0a0',
            }}
          >
            Website Change Monitor
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
