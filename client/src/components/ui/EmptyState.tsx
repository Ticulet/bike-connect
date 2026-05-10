import type { ReactNode } from 'react';
import './empty-state.css';

interface EmptyStateProps {
  /** Inline SVG icon (24–48 px). */
  icon: ReactNode;
  /** Title (h2). */
  title: string;
  /** Lead paragraph. */
  description?: string;
  /** Primary CTA — link or button. */
  action?: ReactNode;
  /** Optional secondary action below primary. */
  secondaryAction?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h2 className="empty-state__title">{title}</h2>
      {description != null && (
        <p className="empty-state__description">{description}</p>
      )}
      {(action != null || secondaryAction != null) && (
        <div className="empty-state__actions">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
