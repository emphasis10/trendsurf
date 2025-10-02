'use client';

import type { EmbeddingSettings, UserProfile } from '../../lib/types';
import { GenerationSettingsForm } from './GenerationSettingsForm';
import { EmbeddingSettingsCard } from './EmbeddingSettingsCard';

interface SettingsViewProps {
  user: UserProfile;
  embedding: EmbeddingSettings;
}

export function SettingsView({ user, embedding }: SettingsViewProps) {
  return (
    <div className="settings-page">
      <section className="settings-page__section">
        <h1>Settings</h1>
        <p>Configure your generation provider and review embedding defaults.</p>
      </section>
      <section className="settings-page__section">
        <GenerationSettingsForm initialProvider={user.llm_provider} initialModel={user.llm_model} />
      </section>
      <section className="settings-page__section">
        <EmbeddingSettingsCard embedding={embedding} />
      </section>
    </div>
  );
}
