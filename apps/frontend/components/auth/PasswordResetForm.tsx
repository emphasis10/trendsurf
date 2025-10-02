'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { requestPasswordResetAction } from '../../lib/auth/actions';

interface FormState {
  error?: string;
  success?: boolean;
}

const initialState: FormState = { success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Sending reset link...' : 'Send reset link'}
    </button>
  );
}

export function PasswordResetForm() {
  const [state, action] = useFormState(requestPasswordResetAction, initialState);

  return (
    <form action={action} className="form">
      <label className="form-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      {state?.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      {state?.success ? (
        <p className="form-success" role="status">
          If an account exists we sent a reset link to your email.
        </p>
      ) : null}
      <SubmitButton />
      <div className="form-footer">
        <Link href="/signin">Back to sign in</Link>
      </div>
    </form>
  );
}
