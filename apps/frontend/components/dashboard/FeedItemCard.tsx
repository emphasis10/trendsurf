import Link from 'next/link';
import type { FeedItem } from '../../lib/types';
import { formatAuthors, formatDate } from '../../lib/utils';

interface FeedItemCardProps {
  item: FeedItem;
}

function formatMatchScore(score: number): string {
  if (Number.isNaN(score)) {
    return '0.00';
  }
  return score.toFixed(2);
}

export function FeedItemCard({ item }: FeedItemCardProps) {
  const { paper, analysis, match_score: matchScore } = item;

  return (
    <article className="feed-card">
      <header className="feed-card__header">
        <div>
          <h2>
            <Link href={`/papers/${paper.id}`}>{paper.title}</Link>
          </h2>
          <p className="feed-card__meta">
            <span>{formatAuthors(paper.authors)}</span>
            <span aria-hidden="true">•</span>
            <span>{formatDate(paper.published_at)}</span>
            <span aria-hidden="true">•</span>
            <span>Match score {formatMatchScore(matchScore)}</span>
          </p>
        </div>
        <div className="feed-card__score">
          <span className="feed-card__score-value">{analysis.novelty_score.toFixed(1)}</span>
          <span className="feed-card__score-label">Novelty ({analysis.novelty_confidence})</span>
        </div>
      </header>
      {analysis.tldr.length ? (
        <section className="feed-card__tldr">
          <h3>TL;DR</h3>
          <ul>
            {analysis.tldr.map((bullet, index) => (
              <li key={index}>{bullet}</li>
            ))}
          </ul>
        </section>
      ) : null}
      <footer className="feed-card__footer">
        <Link href={`/papers/${paper.id}`} className="button button--ghost">
          View details
        </Link>
        {paper.url_pdf ? (
          <a href={paper.url_pdf} className="button button--ghost" target="_blank" rel="noopener noreferrer">
            PDF
          </a>
        ) : null}
      </footer>
    </article>
  );
}
