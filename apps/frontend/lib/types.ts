export type LlmProvider = 'ollama' | 'openai_compat';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  llm_provider: LlmProvider;
  llm_model: string;
}

export interface TopicFilters {
  categories?: string[];
  keywords?: string[];
  date_from?: string;
  date_to?: string;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  filters: TopicFilters;
  created_at: string;
  updated_at: string;
}

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  authors: string[];
  published_at: string;
  source: string;
  source_id: string;
  url_pdf?: string;
}

export interface AnalysisSummary {
  paper_id: string;
  tldr: string[];
  analysis: {
    method?: string;
    data?: string;
    results?: string;
    limitations?: string;
    impact?: string;
  };
  novelty_score: number;
  novelty_confidence: 'low' | 'medium' | 'high';
  novelty_rationale?: string;
}

export interface FeedItem {
  paper: Paper;
  analysis: AnalysisSummary;
  match_score: number;
}

export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
}

export interface PaperDetailResponse {
  paper: Paper;
  analysis: AnalysisSummary;
  related: FeedItem[];
}

export interface EmbeddingSettings {
  provider: LlmProvider;
  model: string;
}

export interface GenerationSettings {
  llm_provider: LlmProvider;
  llm_model: string;
}

export interface ApiErrorPayload {
  detail?: string | string[] | Record<string, unknown>;
  message?: string;
  code?: string;
}

export interface ApiListResponse<T> {
  items: T[];
}
