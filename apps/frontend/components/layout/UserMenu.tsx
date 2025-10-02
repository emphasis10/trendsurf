'use client';

import { useFormStatus } from 'react-dom';
import type { UserProfile } from '../../lib/types';

interface UserMenuProps {
  user: UserProfile;
  onSignOut: () => Promise<void>;
}

export function UserMenu({ user, onSignOut }: UserMenuProps) {
  return (
    <div className="user-menu">
      <div className="user-menu__details">
        <span className="user-menu__name">{user.name || user.email}</span>
        <span className="user-menu__meta">{user.role}</span>
      </div>
      <form action={onSignOut}>
        <SignOutButton />
      </form>
    </div>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="button button--ghost" disabled={pending}>
      {pending ? 'Signing out...' : 'Sign out'}
    </button>
  );
}
