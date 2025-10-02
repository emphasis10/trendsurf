import { redirect } from 'next/navigation';
import { SettingsView } from '../../../components/settings/SettingsView';
import { fetchCurrentUser, fetchEmbeddingSettings } from '../../../lib/data-fetchers';

export const metadata = {
  title: 'Settings - TrendSurf'
};

export default async function SettingsPage() {
  const user = await fetchCurrentUser();
  if (!user) {
    redirect('/signin');
  }
  const embedding = await fetchEmbeddingSettings();
  return <SettingsView user={user} embedding={embedding} />;
}
