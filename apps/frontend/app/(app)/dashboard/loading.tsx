import { FeedItemSkeleton } from '../../../components/dashboard/FeedItemSkeleton';

export default function DashboardLoading() {
  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div>
          <h1>Dashboard</h1>
          <p>Loading your matches...</p>
        </div>
        <div className="topic-select">
          <span>Topic</span>
          <div className="topic-select__skeleton" />
        </div>
      </div>
      <ul className="feed__list">
        {Array.from({ length: 3 }).map((_, index) => (
          <li key={index}>
            <FeedItemSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
