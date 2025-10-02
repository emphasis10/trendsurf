'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, ApiError } from '../api-client';
import type { GenerationSettings, UserProfile } from '../types';

interface SettingsActionState {
  success?: boolean;
  error?: string;
  profile?: UserProfile;
}

function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to save settings.';
}

export async function updateGenerationSettingsAction(
  _prev: SettingsActionState,
  formData: FormData
): Promise<SettingsActionState> {
  try {
    const provider = formData.get('llm_provider');
    const model = formData.get('llm_model');

    if (typeof provider !== 'string' || typeof model !== 'string' || !model.trim()) {
      return { error: 'Provider and model are required.' };
    }

    const payload: GenerationSettings = {
      llm_provider: provider as GenerationSettings['llm_provider'],
      llm_model: model.trim()
    };

    const profile = await apiFetch<UserProfile>('/me', {
      method: 'PATCH',
      json: payload
    });

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    return { success: true, profile };
  } catch (error) {
    return { error: parseError(error) };
  }
}
