'use server';

import { apiFetch } from '../api-client';
import type { FeedResponse } from '../types';

export async function loadFeedPageAction(topicId?: string | null, cursor?: string | null): Promise<FeedResponse> {
  return apiFetch<FeedResponse>('/feed', {
    query: {
      topic_id: topicId ?? undefined,
      cursor: cursor ?? undefined
    }
  });
}
