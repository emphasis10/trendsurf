import { redirect } from 'next/navigation';
import { AuthPage } from '../../../components/auth/AuthPage';
import { SignInForm } from '../../../components/auth/SignInForm';
import { fetchCurrentUser } from '../../../lib/data-fetchers';

export const metadata = {
  title: 'Sign in - TrendSurf'
};

export default async function SignInPage() {
  const user = await fetchCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthPage
      title="Welcome back"
      description="Track topic-specific paper trends with automated AI summaries."
    >
      <SignInForm />
    </AuthPage>
  );
}
