import { redirect } from 'next/navigation';
import { AuthPage } from '../../../components/auth/AuthPage';
import { PasswordResetForm } from '../../../components/auth/PasswordResetForm';
import { fetchCurrentUser } from '../../../lib/data-fetchers';

export const metadata = {
  title: 'Reset password - TrendSurf'
};

export default async function ResetPasswordPage() {
  const user = await fetchCurrentUser();
  if (user) {
    redirect('/dashboard');
  }

  return (
    <AuthPage title="Reset your password" description="Enter your email to receive a reset link.">
      <PasswordResetForm />
    </AuthPage>
  );
}
