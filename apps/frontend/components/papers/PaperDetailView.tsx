import Link from 'next/link';
import type { PaperDetailResponse } from '../../lib/types';
import { formatAuthors, formatDate } from '../../lib/utils';
import { FeedItemCard } from '../dashboard/FeedItemCard';

interface PaperDetailViewProps {
  detail: PaperDetailResponse;
}

export function PaperDetailView({ detail }: PaperDetailViewProps) {
  const { paper, analysis, related } = detail;

  return (
    <div className="paper-detail">
      <header className="paper-detail__header">
        <div>
          <h1>{paper.title}</h1>
          <p className="paper-detail__meta">
            <span>{formatAuthors(paper.authors)}</span>
            <span aria-hidden="true">•</span>
            <span>{formatDate(paper.published_at)}</span>
            <span aria-hidden="true">•</span>
            <span>{paper.source.toUpperCase()}</span>
            {paper.url_pdf ? (
              <>
                <span aria-hidden="true">•</span>
                <a href={paper.url_pdf} target="_blank" rel="noopener noreferrer">
                  PDF
                </a>
              </>
            ) : null}
          </p>
        </div>
        <div className="paper-detail__score">
          <span className="paper-detail__score-value">{analysis.novelty_score.toFixed(1)}</span>
          <span className="paper-detail__score-label">Novelty ({analysis.novelty_confidence})</span>
        </div>
      </header>

      <section className="paper-detail__section">
        <h2>TL;DR</h2>
        {analysis.tldr.length ? (
          <ul className="paper-detail__bullets">
            {analysis.tldr.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p>No summary available yet.</p>
        )}
      </section>

      <section className="paper-detail__section">
        <h2>Structured analysis</h2>
        <dl className="paper-detail__analysis">
          <div>
            <dt>Method</dt>
            <dd>{analysis.analysis.method || 'Not captured'}</dd>
          </div>
          <div>
            <dt>Data</dt>
            <dd>{analysis.analysis.data || 'Not captured'}</dd>
          </div>
          <div>
            <dt>Results</dt>
            <dd>{analysis.analysis.results || 'Not captured'}</dd>
          </div>
          <div>
            <dt>Limitations</dt>
            <dd>{analysis.analysis.limitations || 'Not captured'}</dd>
          </div>
          <div>
            <dt>Impact</dt>
            <dd>{analysis.analysis.impact || 'Not captured'}</dd>
          </div>
        </dl>
      </section>

      <section className="paper-detail__section">
        <h2>Novelty rationale</h2>
        {analysis.novelty_rationale ? <p>{analysis.novelty_rationale}</p> : <p>No rationale yet.</p>}
      </section>

      {related.length ? (
        <section className="paper-detail__section">
          <div className="paper-detail__section-header">
            <h2>Related matches</h2>
            <Link href="/dashboard" className="button button--ghost">
              Back to dashboard
            </Link>
          </div>
          <ul className="paper-detail__related">
            {related.map((item) => (
              <li key={item.paper.id}>
                <FeedItemCard item={item} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
