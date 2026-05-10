import type { ReactNode } from 'react';
import './page-header.css';

interface PageHeaderProps {
  /** Eyebrow (small caps, above heading). Optional. */
  eyebrow?: string;
  /** Page heading (renders as &lt;h1&gt;). */
  title: string;
  /** Optional subtitle line. */
  subtitle?: string;
  /** Optional actions slot (typically buttons). */
  actions?: ReactNode;
  /**
   * Visual variant — "editorial" (Fraunces display) or "workshop" (small caps + serif).
   * Defaults to "editorial".
   */
  variant?: 'editorial' | 'workshop';
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  variant = 'editorial',
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={`page-header page-header--${variant}`}>
      {eyebrow != null && (
        <p className="page-header__eyebrow">{eyebrow}</p>
      )}
      <div className="page-header__row">
        <div className="page-header__title-block">
          <h1 className="page-header__title">{title}</h1>
          {subtitle != null && (
            <p className="page-header__subtitle">{subtitle}</p>
          )}
        </div>
        {actions != null && (
          <div className="page-header__actions">{actions}</div>
        )}
      </div>
    </header>
  );
}
