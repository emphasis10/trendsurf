'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signInAction } from '../../lib/auth/actions';

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  );
}

export function SignInForm() {
  const [state, action] = useFormState(signInAction, initialState);

  return (
    <form action={action} className="form">
      <label className="form-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input type="password" name="password" required autoComplete="current-password" />
      </label>
      {state?.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <SubmitButton />
      <div className="form-footer">
        <span>Need an account?</span>
        <Link href="/signup">Sign up</Link>
      </div>
      <div className="form-footer">
        <span>Forgot your password?</span>
        <Link href="/reset-password">Reset it</Link>
      </div>
    </form>
  );
}
