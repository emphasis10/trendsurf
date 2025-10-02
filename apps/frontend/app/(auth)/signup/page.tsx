import { redirect } from 'next/navigation';
import { AuthPage } from '../../../components/auth/AuthPage';
import { SignUpForm } from '../../../components/auth/SignUpForm';
import { fetchCurrentUser } from '../../../lib/data-fetchers';

export const metadata = {
  title: 'Create account - TrendSurf'
};

export default async function SignUpPage() {
  const user = await fetchCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthPage title="Create your TrendSurf account" description="Stay ahead of paper trends for your topics.">
      <SignUpForm />
    </AuthPage>
  );
}
