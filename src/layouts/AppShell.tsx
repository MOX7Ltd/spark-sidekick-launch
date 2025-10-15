import { ReactNode } from 'react';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';

interface AppShellProps {
  children: ReactNode;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

/**
 * AppShell: Global layout wrapper with sticky header and footer
 * Ensures consistent navigation across all pages including onboarding
 */
export default function AppShell({ children, hideHeader = false, hideFooter = false }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideHeader && <SiteHeader />}
      <main className="flex-1">{children}</main>
      {!hideFooter && <SiteFooter />}
    </div>
  );
}
