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
  if (!change) return { title: 'Change not found — Cheetah Ping' };

  const summary = change.aiSummary || change.diffSummary || 'A change was detected';
  const label = change.monitorLabel || new URL(change.monitorUrl).hostname;

  return {
    title: `${label} changed — Cheetah Ping`,
    description: summary.slice(0, 160),
    openGraph: {
      title: `Change detected: ${label}`,
      description: summary.slice(0, 160),
      siteName: 'Cheetah Ping',
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
      <div className="max-w-lg mx-auto px-4 py-16 space-y-8">
        {/* Branding */}
        <div className="text-center">
          <Link href="/" className="font-heading text-2xl font-bold gradient-text">
            Cheetah Ping
          </Link>
        </div>

        {/* Change card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Change detected</span>
            <span className="text-xs text-white/40 ml-auto">{timeAgo}</span>
          </div>

          <div>
            <h1 className="text-lg font-bold">{label}</h1>
            <p className="text-sm text-white/40">{hostname}</p>
          </div>

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
            Powered by Cheetah Ping — Website change monitoring for everyone
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
