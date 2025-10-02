'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { signUpAction } from '../../lib/auth/actions';

const initialState = { error: undefined as string | undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button" disabled={pending}>
      {pending ? 'Creating account...' : 'Create account'}
    </button>
  );
}

export function SignUpForm() {
  const [state, action] = useFormState(signUpAction, initialState);

  return (
    <form action={action} className="form">
      <label className="form-field">
        <span>Name</span>
        <input type="text" name="name" autoComplete="name" />
      </label>
      <label className="form-field">
        <span>Email</span>
        <input type="email" name="email" required autoComplete="email" />
      </label>
      <label className="form-field">
        <span>Password</span>
        <input type="password" name="password" required autoComplete="new-password" />
      </label>
      <label className="form-field">
        <span>Confirm password</span>
        <input type="password" name="confirmPassword" required autoComplete="new-password" />
      </label>
      {state?.error ? <p className="form-error" role="alert">{state.error}</p> : null}
      <SubmitButton />
      <div className="form-footer">
        <span>Already have an account?</span>
        <Link href="/signin">Sign in</Link>
      </div>
    </form>
  );
}
