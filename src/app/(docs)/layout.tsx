import { RootProvider } from 'fumadocs-ui/provider/next';
import 'fumadocs-ui/style.css';
import './docs-theme.css';
import type { ReactNode } from 'react';

export default function DocsGroupLayout({ children }: { children: ReactNode }) {
  return <RootProvider>{children}</RootProvider>;
}
