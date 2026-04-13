import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/docs-source';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      tree={source.pageTree}
      nav={{
        title: (
          <div className="flex items-center gap-2">
            <img src="/icon.png" alt="" className="w-5 h-5" />
            <span>Cheetah Ping</span>
          </div>
        ),
        url: '/',
      }}
      links={[
        {
          type: 'button',
          text: 'Return to Dashboard',
          url: '/dashboard',
          icon: <ArrowLeft />,
          active: 'none',
        },
      ]}
    >
      {children}
    </DocsLayout>
  );
}
