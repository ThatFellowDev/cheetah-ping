import { eq, and } from 'drizzle-orm';
import { db } from '@/shared/database/db';
import { changeLog, monitors } from '@/shared/database/schema';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ token: string }>;
}

async function getSharedChange(token: string) {
  const [change] = await db
    .select({
      diffSummary: changeLog.diffSummary,
      aiSummary: changeLog.aiSummary,
      detectedAt: changeLog.detectedAt,
      beforeScreenshotUrl: changeLog.beforeScreenshotUrl,
      afterScreenshotUrl: changeLog.afterScreenshotUrl,
      monitorLabel: monitors.label,
      monitorUrl: monitors.url,
      shareEnabled: monitors.shareEnabled,
    })
    .from(changeLog)
    .innerJoin(monitors, eq(changeLog.monitorId, monitors.id))
    .where(and(eq(changeLog.shareToken, token), eq(monitors.shareEnabled, true)))
    .limit(1);

  return change || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const change = await getSharedChange(token);
  if (!change) return { title: 'Change not found | Cheetah Ping' };

  const summary = change.aiSummary || change.diffSummary || 'A change was detected';
  const label = change.monitorLabel || new URL(change.monitorUrl).hostname;

  // The "after" screenshot is what makes the social preview compelling —
  // pass it through OpenGraph + Twitter card so links unfurl with the
  // actual changed page in feeds.
  const ogImage = change.afterScreenshotUrl || undefined;

  return {
    title: `${label} changed | Cheetah Ping`,
    description: summary.slice(0, 160),
    openGraph: {
      title: `Change detected: ${label}`,
      description: summary.slice(0, 160),
      siteName: 'Cheetah Ping',
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title: `Change detected: ${label}`,
      description: summary.slice(0, 160),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default async function SharedChangePage({ params }: Props) {
  const { token } = await params;
  const change = await getSharedChange(token);
  if (!change) notFound();

  const summary = change.aiSummary || change.diffSummary || 'A change was detected';
  const label = change.monitorLabel || new URL(change.monitorUrl).hostname;
  const hostname = new URL(change.monitorUrl).hostname;
  const timeAgo = getRelativeTime(change.detectedAt);

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 space-y-8">
        {/* Branding */}
        <div className="text-center">
          <Link href="/" className="font-heading text-2xl font-bold gradient-text">
            Cheetah Ping
          </Link>
        </div>

        {/* Change card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Change detected</span>
            <span className="text-xs text-white/40 ml-auto">{timeAgo}</span>
          </div>

          <div>
            <h1 className="text-lg font-bold">{label}</h1>
            <p className="text-sm text-white/40">{hostname}</p>
          </div>

          {/* Before/after screenshots — the viral surface. Stacked on mobile,
              side-by-side on small screens and up. Falls back gracefully when
              one or both images are missing (e.g. older changes pre-screenshot
              feature, or capture failure). */}
          {(change.beforeScreenshotUrl || change.afterScreenshotUrl) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {change.beforeScreenshotUrl ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Before</p>
                  <div className="aspect-[16/10] rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={change.beforeScreenshotUrl}
                      alt="Page before the change"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Before</p>
                  <div className="aspect-[16/10] rounded-lg border border-dashed border-white/10 flex items-center justify-center text-[11px] text-white/30">
                    No prior snapshot
                  </div>
                </div>
              )}
              {change.afterScreenshotUrl && (
                <div className="space-y-1.5">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">After</p>
                  <div className="aspect-[16/10] rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={change.afterScreenshotUrl}
                      alt="Page after the change"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm text-white/70 leading-relaxed">{summary}</p>
          </div>

          {change.aiSummary && change.diffSummary && change.aiSummary !== change.diffSummary && (
            <p className="text-xs text-white/30">
              Raw diff: {change.diffSummary.slice(0, 200)}
            </p>
          )}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <p className="text-sm text-white/50">
            Want to catch changes like this?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 text-black font-semibold text-sm hover:shadow-[0_0_20px_oklch(0.78_0.16_75_/_40%)] transition-shadow"
          >
            Start monitoring for free
          </Link>
          <p className="text-xs text-white/30">
            No credit card required. 5 free monitors.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-white/5">
          <Link href="/" className="text-xs text-white/30 hover:text-white/50 transition-colors">
            Powered by Cheetah Ping. Paste a link, get alerted when it changes.
          </Link>
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
