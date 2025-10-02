'use server';

import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '../data-fetchers';
import type { UserProfile } from '../types';

export async function requireUser(): Promise<UserProfile> {
  const user = await fetchCurrentUser();
  if (!user) {
    redirect('/signin');
  }
  return user;
}
