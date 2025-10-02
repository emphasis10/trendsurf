import type { ReactNode } from 'react';
import { AppShell } from '../../components/layout/AppShell';
import { requireUser } from '../../lib/auth/user';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  return <AppShell user={user}>{children}</AppShell>;
}
