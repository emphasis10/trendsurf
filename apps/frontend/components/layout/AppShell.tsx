import type { Route } from 'next';
import type { ReactNode } from 'react';
import { signOutAction } from '../../lib/auth/actions';
import type { UserProfile } from '../../lib/types';
import { UserMenu } from './UserMenu';
import { NavLink } from './NavLink';
import Link from 'next/link';

interface AppShellProps {
  user: UserProfile;
  children: ReactNode;
}

const NAV_LINKS: Array<{ href: Route; label: string }> = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/topics', label: 'Topics' },
  { href: '/settings', label: 'Settings' }
];

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <Link href="/dashboard" className="app-shell__brand">
          TrendSurf
        </Link>
        <nav className="app-shell__nav">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.href} href={link.href}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <UserMenu user={user} onSignOut={signOutAction} />
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
