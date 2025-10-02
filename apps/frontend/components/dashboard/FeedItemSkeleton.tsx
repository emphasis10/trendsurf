export function FeedItemSkeleton() {
  return (
    <article className="feed-card feed-card--skeleton" aria-hidden="true">
      <div className="feed-card__skeleton-line feed-card__skeleton-line--title" />
      <div className="feed-card__skeleton-line feed-card__skeleton-line--meta" />
      <div className="feed-card__skeleton-line" />
      <div className="feed-card__skeleton-line" />
    </article>
  );
}
