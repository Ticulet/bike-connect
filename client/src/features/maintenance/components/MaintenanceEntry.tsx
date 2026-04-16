import { useState } from 'react';
import { Link } from 'react-router';
import type { MaintenanceLogItem } from '../api/maintenance.api.js';

interface MaintenanceEntryProps {
  log: MaintenanceLogItem;
  onDelete: () => void;
  isOwner: boolean;
}

function formatCost(cost: string): string {
  const value = parseFloat(cost);
  if (Number.isNaN(value)) return cost;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function MaintenanceEntry({
  log,
  onDelete,
  isOwner,
}: MaintenanceEntryProps): React.JSX.Element {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const entryModifier = `maintenance-entry--${log.type}`;
  const badgeModifier = `maintenance-entry__type-badge--${log.type}`;

  const hasMeta =
    log.component_name !== null ||
    log.cost !== null ||
    log.mileage_at_service !== null;

  return (
    <article className={`maintenance-entry ${entryModifier}`}>
      <header className="maintenance-entry__header">
        <span className={`maintenance-entry__type-badge ${badgeModifier}`}>{log.type}</span>
        <h3 className="maintenance-entry__title">{log.title}</h3>
        <time className="maintenance-entry__date" dateTime={log.performed_at}>
          {formatDate(log.performed_at)}
        </time>
      </header>

      {hasMeta && (
        <div className="maintenance-entry__meta">
          {log.component_name !== null && (
            <span className="maintenance-entry__component-badge">{log.component_name}</span>
          )}
          {log.cost !== null && (
            <span className="maintenance-entry__cost">{formatCost(log.cost)}</span>
          )}
          {log.mileage_at_service !== null && (
            <span className="maintenance-entry__mileage">
              {log.mileage_at_service.toLocaleString()} km
            </span>
          )}
        </div>
      )}

      {log.description !== null && (
        <>
          <button
            type="button"
            className="maintenance-entry__description-toggle"
            onClick={() => setDescriptionExpanded((prev) => !prev)}
            aria-expanded={descriptionExpanded}
            aria-controls={`desc-${log.id}`}
          >
            {descriptionExpanded ? 'Hide details' : 'Show details'}
          </button>
          {descriptionExpanded && (
            <p id={`desc-${log.id}`} className="maintenance-entry__description">
              {log.description}
            </p>
          )}
        </>
      )}

      {isOwner && (
        <div className="maintenance-entry__actions">
          <Link
            to={`/my-bikes/${log.bike_id}/maintenance/${log.id}/edit`}
            className="maintenance-entry__edit-btn"
            aria-label={`Edit ${log.title}`}
          >
            Edit
          </Link>
          <button
            type="button"
            className="maintenance-entry__delete-btn"
            onClick={onDelete}
            aria-label={`Delete ${log.title}`}
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
