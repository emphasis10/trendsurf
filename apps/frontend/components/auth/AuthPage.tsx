import type { ReactNode } from 'react';

interface AuthPageProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
