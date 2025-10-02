'use client';

import Link from 'next/link';
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Route } from 'next';
import { loadFeedPageAction } from '../../lib/feed/actions';
import type { FeedItem, FeedResponse, Topic } from '../../lib/types';
import { classNames } from '../../lib/utils';
import { FeedItemCard } from './FeedItemCard';
import { FeedItemSkeleton } from './FeedItemSkeleton';

interface DashboardViewProps {
  topics: Topic[];
  selectedTopicId?: string;
  initialFeed: FeedResponse;
}

interface FeedPlaceholderEntry {
  kind: 'placeholder';
  id: string;
}

interface FeedDataEntry {
  kind: 'data';
  item: FeedItem;
}

type FeedListEntry = FeedPlaceholderEntry | FeedDataEntry;

interface OptimisticFeedState {
  entries: FeedListEntry[];
  nextCursor: string | null;
  loading: boolean;
}

type OptimisticAction =
  | { type: 'reset'; state: OptimisticFeedState }
  | { type: 'start-loading'; count: number }
  | { type: 'finish-loading'; items: FeedItem[]; nextCursor: string | null }
  | { type: 'error'; keepCursor: string | null };

const PLACEHOLDER_COUNT = 3;

export function DashboardView({ topics, selectedTopicId, initialFeed }: DashboardViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const defaultTopicId = topics[0]?.id ?? '';
  const activeTopicId = selectedTopicId ?? defaultTopicId;
  const baseState = useMemo<OptimisticFeedState>(
    () => ({
      entries: initialFeed.items.map<FeedListEntry>((item) => ({ kind: 'data', item })),
      nextCursor: initialFeed.nextCursor ?? null,
      loading: false
    }),
    [initialFeed]
  );

  const [state, applyOptimistic] = useOptimistic<OptimisticFeedState, OptimisticAction>(
    baseState,
    (current, action) => {
      switch (action.type) {
        case 'reset':
          return action.state;
        case 'start-loading': {
          const placeholders: FeedPlaceholderEntry[] = Array.from({ length: action.count }).map(() => ({
            kind: 'placeholder',
            id: crypto.randomUUID()
          }));
          return {
            entries: [
              ...current.entries.filter((entry): entry is FeedDataEntry => entry.kind === 'data'),
              ...placeholders
            ],
            nextCursor: current.nextCursor,
            loading: true
          };
        }
        case 'finish-loading': {
          return {
            entries: [
              ...current.entries.filter((entry): entry is FeedDataEntry => entry.kind === 'data'),
              ...action.items.map<FeedListEntry>((item) => ({ kind: 'data', item }))
            ],
            nextCursor: action.nextCursor,
            loading: false
          };
        }
        case 'error':
          return {
            entries: current.entries.filter((entry): entry is FeedDataEntry => entry.kind === 'data'),
            loading: false,
            nextCursor: action.keepCursor
          };
        default:
          return current;
      }
    }
  );

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    applyOptimistic({ type: 'reset', state: baseState });
    setError(null);
  }, [baseState, applyOptimistic]);

  const [pending, startTransition] = useTransition();

  const handleTopicChange = (topicId: string) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (topicId) {
      params.set('topic', topicId);
    } else {
      params.delete('topic');
    }
    const query = params.size ? `?${params.toString()}` : '';
    const href = (`/dashboard${query}`) as Route;
    router.replace(href);
  };

  const loadMore = () => {
    const cursor = stateRef.current.nextCursor;
    if (!cursor) {
      return;
    }
    setError(null);
    applyOptimistic({ type: 'start-loading', count: PLACEHOLDER_COUNT });
    startTransition(async () => {
      try {
        const response = await loadFeedPageAction(activeTopicId, cursor);
        applyOptimistic({
          type: 'finish-loading',
          items: response.items,
          nextCursor: response.nextCursor ?? null
        });
      } catch (err) {
        console.error(err);
        setError('Unable to load more right now.');
        applyOptimistic({ type: 'error', keepCursor: cursor });
      }
    });
  };

  const hasTopics = topics.length > 0;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Latest matches and analyses for your topics.</p>
        </div>
        {hasTopics ? (
          <label className="topic-select">
            <span>Topic</span>
            <select
              value={activeTopicId}
              onChange={(event) => handleTopicChange(event.target.value)}
            >
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <Link href="/topics" className="button">
            Create your first topic
          </Link>
        )}
      </div>

      {!hasTopics ? (
        <div className="empty-state">
          <p>Add at least one topic to start tracking arXiv papers.</p>
        </div>
      ) : (
        <div className="feed">
          {state.entries.length === 0 && !state.loading ? (
            <div className="empty-state">
              <p>No results yet. Check back after an ingest run.</p>
            </div>
          ) : (
            <ul className="feed__list">
              {state.entries.map((entry) => (
                <li key={entry.kind === 'data' ? entry.item.paper.id : entry.id}>
                  {entry.kind === 'data' ? <FeedItemCard item={entry.item} /> : <FeedItemSkeleton />}
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="feed__actions">
            {state.nextCursor ? (
              <button
                type="button"
                className={classNames('button', (state.loading || pending) && 'button--loading')}
                onClick={loadMore}
                disabled={state.loading || pending}
              >
                {state.loading || pending ? 'Loading...' : 'Load more'}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
