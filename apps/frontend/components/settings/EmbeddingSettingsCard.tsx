import type { EmbeddingSettings } from '../../lib/types';

interface EmbeddingSettingsCardProps {
  embedding: EmbeddingSettings;
}

export function EmbeddingSettingsCard({ embedding }: EmbeddingSettingsCardProps) {
  return (
    <div className="settings-card">
      <h2>Embedding configuration</h2>
      <p>The embedding model is managed by the system administrator.</p>
      <dl className="settings-card__list">
        <div>
          <dt>Provider</dt>
          <dd>{embedding.provider}</dd>
        </div>
        <div>
          <dt>Model</dt>
          <dd>{embedding.model}</dd>
        </div>
      </dl>
    </div>
  );
}
