import { diffWords } from 'diff';

interface DiffResult {
  changed: boolean;
  summary: string;
}

export function detectChange(
  lastSnapshot: string | null,
  newContent: string,
  keyword?: string | null
): DiffResult {
  // Initial snapshot - no change to report
  if (!lastSnapshot) {
    return { changed: false, summary: 'Initial snapshot captured' };
  }

  // Keyword mode
  if (keyword) {
    const kw = keyword.toLowerCase();
    const wasPresent = lastSnapshot.toLowerCase().includes(kw);
    const isPresent = newContent.toLowerCase().includes(kw);

    if (wasPresent === isPresent) {
      return { changed: false, summary: '' };
    }

    return {
      changed: true,
      summary: isPresent
        ? `Keyword "${keyword}" appeared`
        : `Keyword "${keyword}" disappeared`,
    };
  }

  // Full diff mode
  const changes = diffWords(lastSnapshot, newContent);
  const meaningful = changes.filter(
    (c) => (c.added || c.removed) && c.value.trim().length > 0
  );

  if (meaningful.length === 0) {
    return { changed: false, summary: '' };
  }

  const added = meaningful
    .filter((c) => c.added)
    .map((c) => c.value.trim())
    .join(', ');
  const removed = meaningful
    .filter((c) => c.removed)
    .map((c) => c.value.trim())
    .join(', ');

  const parts: string[] = [];
  if (added) parts.push(`Added: "${added.slice(0, 150)}"`);
  if (removed) parts.push(`Removed: "${removed.slice(0, 150)}"`);

  return { changed: true, summary: parts.join('. ') };
}
