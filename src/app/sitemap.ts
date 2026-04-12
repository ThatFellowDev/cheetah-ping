import type { MetadataRoute } from 'next';
import { USE_CASES } from '@/shared/content/use-cases';
import { source } from '@/lib/docs-source';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://cheetahping.com';

  const useCaseEntries: MetadataRoute.Sitemap = USE_CASES.map((uc) => ({
    url: `${baseUrl}/use-cases/${uc.slug}`,
    lastModified: new Date(uc.updatedAt),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const docsEntries: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/use-cases`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    ...useCaseEntries,
    ...docsEntries,
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];
}
