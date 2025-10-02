'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch, ApiError } from '../api-client';
import { storeTokens, clearTokens } from './session';

interface AuthActionState {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
}

function getValue(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function ensureValue(value: string, message: string) {
  if (!value) {
    throw new Error(message);
  }
  return value;
}

function toFieldError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong, please try again.';
}

export async function signInAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const email = ensureValue(getValue(formData, 'email'), 'Email is required');
    const password = ensureValue(getValue(formData, 'password'), 'Password is required');

    const tokens = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      json: { email, password }
    });

    await storeTokens(tokens);
    revalidatePath('/');
    redirect('/dashboard');
  } catch (error) {
    return { error: toFieldError(error) };
  }
}

export async function signUpAction(_prev: AuthActionState, formData: FormData): Promise<AuthActionState> {
  try {
    const name = getValue(formData, 'name');
    const email = ensureValue(getValue(formData, 'email'), 'Email is required');
    const password = ensureValue(getValue(formData, 'password'), 'Password is required');
    const confirmPassword = ensureValue(getValue(formData, 'confirmPassword'), 'Confirm password is required');

    if (password !== confirmPassword) {
      return { error: 'Passwords do not match.' };
    }

    const tokens = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      skipAuth: true,
      json: { name: name || undefined, email, password }
    });

    await storeTokens(tokens);
    revalidatePath('/');
    redirect('/dashboard');
  } catch (error) {
    return { error: toFieldError(error) };
  }
}

export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    const email = ensureValue(getValue(formData, 'email'), 'Email is required');

    await apiFetch('/auth/password-reset', {
      method: 'POST',
      skipAuth: true,
      json: { email }
    });

    return { success: true };
  } catch (error) {
    return { error: toFieldError(error) };
  }
}

export async function signOutAction() {
  await clearTokens();
  revalidatePath('/');
  redirect('/signin');
}
