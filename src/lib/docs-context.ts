import { source } from '@/lib/docs-source';

let cachedContext: string | null = null;

export function getDocsContext(): string {
  if (cachedContext) return cachedContext;

  const pages = source.getPages();
  cachedContext = pages
    .map((p) => {
      const title = p.data.title ?? '';
      const description = p.data.description ?? '';
      const url = p.url;
      // Use the raw MDX body text if available, otherwise fall back to metadata
      const body = typeof p.data.body === 'string' ? p.data.body : '';
      return `## ${title}\nURL: ${url}\n${description}\n\n${body}`;
    })
    .join('\n\n---\n\n');

  return cachedContext;
}
