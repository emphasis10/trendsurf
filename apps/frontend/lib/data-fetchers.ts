import { apiFetch, ApiError } from './api-client';
import type {
  EmbeddingSettings,
  FeedResponse,
  PaperDetailResponse,
  Topic,
  UserProfile,
  ApiListResponse
} from './types';

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  try {
    return await apiFetch<UserProfile>('/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function fetchTopics(): Promise<Topic[]> {
  const response = await apiFetch<ApiListResponse<Topic>>('/topics');
  return response.items;
}

export async function fetchFeed(params: { topicId?: string; cursor?: string }): Promise<FeedResponse> {
  return apiFetch<FeedResponse>('/feed', {
    query: {
      topic_id: params.topicId,
      cursor: params.cursor
    }
  });
}

export async function fetchPaperDetail(paperId: string): Promise<PaperDetailResponse> {
  return apiFetch<PaperDetailResponse>(`/papers/${paperId}`);
}

export async function fetchEmbeddingSettings(): Promise<EmbeddingSettings> {
  return apiFetch<EmbeddingSettings>('/settings/embedding');
}
