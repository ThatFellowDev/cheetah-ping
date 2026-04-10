import { diffWords } from 'diff';

interface DiffResult {
  changed: boolean;
  summary: string;
}

const NOISE_PATTERNS = [
  // Time strings: "3:45 PM", "15:45:00", "12:00"
  /^\d{1,2}:\d{2}(:\d{2})?\s*(AM|PM)?$/i,
  // ISO dates: "2024-01-15", "2024-01-15T..."
  /^\d{4}-\d{2}-\d{2}/,
  // Written dates: "Jan 15, 2024", "January 15"
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d/i,
  /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
  // Relative times: "2 hours ago", "just now", "5 min ago"
  /^\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?)\s*ago$/i,
  /^just\s+now$/i,
  /^(today|yesterday|tomorrow)$/i,
  // View/like counters: "1,234 views", "42 comments"
  /^[\d,]+\s*(views?|comments?|likes?|shares?|followers?|subscribers?|reactions?|replies|posts?)$/i,
  // Session IDs, cache busters, long random strings
  /^[a-f0-9]{16,}$/i,
  /^[A-Za-z0-9_-]{24,}$/,
  // Standalone year numbers
  /^\d{4}$/,
];

function isNoiseChange(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  return NOISE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function detectChange(
  lastSnapshot: string | null,
  newContent: string,
  keyword?: string | null
): DiffResult {
  if (!lastSnapshot) {
    return { changed: false, summary: 'Initial snapshot captured' };
  }

  if (keyword) {
    const kw = keyword.toLowerCase();
    const wasPresent = lastSnapshot.toLowerCase().includes(kw);
    const isPresent = newContent.toLowerCase().includes(kw);

    if (wasPresent === isPresent) return { changed: false, summary: '' };

    return {
      changed: true,
      summary: isPresent
        ? `Keyword "${keyword}" appeared`
        : `Keyword "${keyword}" disappeared`,
    };
  }

  const changes = diffWords(lastSnapshot, newContent);
  const meaningful = changes.filter(
    (c) => (c.added || c.removed) && c.value.trim().length > 0 && !isNoiseChange(c.value)
  );

  if (meaningful.length === 0) return { changed: false, summary: '' };

  const added = meaningful.filter((c) => c.added).map((c) => c.value.trim()).join(', ');
  const removed = meaningful.filter((c) => c.removed).map((c) => c.value.trim()).join(', ');

  const parts: string[] = [];
  if (added) parts.push(`Added: "${added.slice(0, 150)}"`);
  if (removed) parts.push(`Removed: "${removed.slice(0, 150)}"`);

  return { changed: true, summary: parts.join('. ') };
}
