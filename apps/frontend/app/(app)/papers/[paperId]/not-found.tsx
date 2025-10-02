import Link from 'next/link';

export default function PaperNotFound() {
  return (
    <div className="paper-detail">
      <div className="empty-state">
        <h1>Paper not found</h1>
        <p>The paper you are looking for may have been removed.</p>
        <Link href="/dashboard" className="button">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
