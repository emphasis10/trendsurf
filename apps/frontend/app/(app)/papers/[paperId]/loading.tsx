import { FeedItemSkeleton } from '../../../../components/dashboard/FeedItemSkeleton';

export default function PaperLoading() {
  return (
    <div className="paper-detail">
      <header className="paper-detail__header">
        <div>
          <div className="paper-detail__skeleton-line paper-detail__skeleton-line--title" />
          <div className="paper-detail__skeleton-line paper-detail__skeleton-line--meta" />
        </div>
        <div className="paper-detail__skeleton-score" />
      </header>
      <section className="paper-detail__section">
        <div className="paper-detail__skeleton-line" />
        <div className="paper-detail__skeleton-line" />
        <div className="paper-detail__skeleton-line" />
      </section>
      <section className="paper-detail__section">
        <ul className="paper-detail__related">
          {Array.from({ length: 2 }).map((_, index) => (
            <li key={index}>
              <FeedItemSkeleton />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
