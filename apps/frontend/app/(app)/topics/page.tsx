import { fetchTopics } from '../../../lib/data-fetchers';
import { TopicManager } from '../../../components/topics/TopicManager';

export const metadata = {
  title: 'Topics - TrendSurf'
};

export default async function TopicsPage() {
  const topics = await fetchTopics();
  return <TopicManager topics={topics} />;
}
