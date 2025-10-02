'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Route } from 'next';
import type { ReactNode } from 'react';
import { classNames } from '../../lib/utils';

interface NavLinkProps {
  href: Route;
  children: ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={classNames('app-shell__nav-link', isActive && 'app-shell__nav-link--active')}
    >
      {children}
    </Link>
  );
}
