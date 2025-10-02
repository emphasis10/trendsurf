'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch, ApiError } from '../api-client';
import type { Topic, TopicFilters } from '../types';

interface TopicActionState {
  success?: boolean;
  error?: string;
  topic?: Topic;
}

function parseList(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function filtersFromForm(formData: FormData): TopicFilters {
  const filters: TopicFilters = {};
  const categories = formData.get('categories');
  const keywords = formData.get('keywords');
  const dateFrom = formData.get('dateFrom');
  const dateTo = formData.get('dateTo');

  if (typeof categories === 'string') {
    const parsed = parseList(categories);
    if (parsed.length) {
      filters.categories = parsed;
    }
  }

  if (typeof keywords === 'string') {
    const parsed = parseList(keywords);
    if (parsed.length) {
      filters.keywords = parsed;
    }
  }

  if (typeof dateFrom === 'string' && dateFrom) {
    filters.date_from = dateFrom;
  }

  if (typeof dateTo === 'string' && dateTo) {
    filters.date_to = dateTo;
  }

  return filters;
}

function parseError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to complete the request.';
}

function revalidateAll() {
  revalidatePath('/dashboard');
  revalidatePath('/topics');
}

export async function createTopicAction(
  _prev: TopicActionState,
  formData: FormData
): Promise<TopicActionState> {
  try {
    const name = formData.get('name');
    if (typeof name !== 'string' || !name.trim()) {
      return { error: 'Topic name is required.' };
    }

    const description = formData.get('description');
    const filters = filtersFromForm(formData);

    const topic = await apiFetch<Topic>('/topics', {
      method: 'POST',
      json: {
        name: name.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
        filters
      }
    });

    revalidateAll();
    return { success: true, topic };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export async function updateTopicAction(
  topicId: string,
  _prev: TopicActionState,
  formData: FormData
): Promise<TopicActionState> {
  try {
    const name = formData.get('name');
    if (typeof name !== 'string' || !name.trim()) {
      return { error: 'Topic name is required.' };
    }

    const description = formData.get('description');
    const filters = filtersFromForm(formData);

    const topic = await apiFetch<Topic>(`/topics/${topicId}`, {
      method: 'PATCH',
      json: {
        name: name.trim(),
        description: typeof description === 'string' && description.trim() ? description.trim() : undefined,
        filters
      }
    });

    revalidateAll();
    return { success: true, topic };
  } catch (error) {
    return { error: parseError(error) };
  }
}

export async function deleteTopicAction(topicId: string): Promise<TopicActionState> {
  try {
    await apiFetch(`/topics/${topicId}`, {
      method: 'DELETE'
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    return { error: parseError(error) };
  }
}
