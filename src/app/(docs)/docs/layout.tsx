import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/docs-source';
import type { ReactNode } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: 'Cheetah Ping',
        url: '/',
      }}
    >
      {children}
    </DocsLayout>
  );
}
