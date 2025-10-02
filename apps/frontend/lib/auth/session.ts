'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  COOKIE_MAX_AGE_SECONDS
} from '../config';

interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

export async function storeTokens(tokens: Tokens): Promise<void> {
  const cookieStore = cookies();
  const maxAge = tokens.expires_in ?? COOKIE_MAX_AGE_SECONDS;

  cookieStore.set(ACCESS_TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  });

  cookieStore.set(REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS
  });
}

export async function clearTokens(): Promise<void> {
  const cookieStore = cookies();

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function requireAuthToken(): Promise<string> {
  const token = cookies().get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) {
    redirect('/signin');
  }
  return token;
}
