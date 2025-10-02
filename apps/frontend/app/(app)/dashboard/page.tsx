import { fetchFeed, fetchTopics } from '../../../lib/data-fetchers';
import { DashboardView } from '../../../components/dashboard/DashboardView';

export const metadata = {
  title: 'Dashboard - TrendSurf'
};

interface DashboardPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const topics = await fetchTopics();
  const topicParam = searchParams?.topic;
  const selectedTopicId = typeof topicParam === 'string' ? topicParam : topics[0]?.id;

  const feed = selectedTopicId
    ? await fetchFeed({ topicId: selectedTopicId })
    : { items: [], nextCursor: undefined };

  return (
    <DashboardView
      topics={topics}
      selectedTopicId={selectedTopicId}
      initialFeed={feed}
    />
  );
}
