import Link from 'next/link';
import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '../lib/data-fetchers';

const FEATURE_BULLETS = [
  'Automated arXiv ingestion with GROBID full-text parsing',
  'AI-generated TL;DRs, structured analysis, and novelty scoring',
  'Topic manager with customizable filters and vector search matching',
  'Switch between Ollama and OpenAI-compatible generation providers'
];

export default async function HomePage() {
  const user = await fetchCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="landing">
      <section className="landing__hero">
        <p className="landing__status">Phase 1 MVP</p>
        <h1>TrendSurf keeps your research topics front and center.</h1>
        <p className="landing__subtitle">
          Track the latest arXiv papers with automated parsing, embeddings, and AI analysis — all in one
          workspace tuned for research teams.
        </p>
        <div className="landing__cta">
          <Link href="/signin" className="button">
            Sign in
          </Link>
          <Link href="/signup" className="button button--ghost">
            Create account
          </Link>
        </div>
      </section>

      <section className="landing__features">
        <div className="landing__card">
          <h2>Why TrendSurf?</h2>
          <ul>
            {FEATURE_BULLETS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="landing__card landing__card--secondary">
          <h2>What&apos;s next</h2>
          <p>
            Background workers coordinate ingestion, embedding, matching, and AI analysis so you can review
            actionable insights instead of sifting through PDFs. Configure providers per user while the
            system manages a single embedding model for consistency.
          </p>
        </div>
      </section>
    </main>
  );
}
