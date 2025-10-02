import type { Topic } from '../../lib/types';

interface TopicCardProps {
  topic: Topic;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
}

function renderFilterList(values?: string[]) {
  if (!values || values.length === 0) {
    return 'None';
  }
  return values.join(', ');
}

export function TopicCard({ topic, onEdit, onDelete, deleting }: TopicCardProps) {
  const { filters } = topic;

  return (
    <article className="topic-card">
      <header className="topic-card__header">
        <div>
          <h2>{topic.name}</h2>
          {topic.description ? <p>{topic.description}</p> : null}
        </div>
        <div className="topic-card__actions">
          <button type="button" className="button button--ghost" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="button button--danger" onClick={onDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </header>
      <dl className="topic-card__filters">
        <div>
          <dt>Categories</dt>
          <dd>{renderFilterList(filters.categories)}</dd>
        </div>
        <div>
          <dt>Keywords</dt>
          <dd>{renderFilterList(filters.keywords)}</dd>
        </div>
        <div>
          <dt>Date range</dt>
          <dd>
            {filters.date_from || filters.date_to
              ? `${filters.date_from ?? 'any'} -> ${filters.date_to ?? 'present'}`
              : 'Any time'}
          </dd>
        </div>
      </dl>
    </article>
  );
}
