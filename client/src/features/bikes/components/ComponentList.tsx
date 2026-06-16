import type { ComponentItem } from '../api/components.api.js';
import './bikes.css';

interface ComponentListProps {
  components: ComponentItem[];
  onEdit: (component: ComponentItem) => void;
  onDelete: (componentId: string) => void;
  isOwner: boolean;
  /** The bike's lifetime odometer (km), used to show each component's distance ridden. */
  bikeMileageKm?: number;
  /** When true, renders as a numbered workshop spec list instead of a table. */
  numbered?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCategory(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Distance a component has been ridden = the bike's odometer now minus its
// odometer when the component was installed. Null when either value is unknown.
function distanceRiddenKm(
  mileageAtInstall: number | null,
  bikeMileageKm: number | undefined,
): number | null {
  if (mileageAtInstall === null || bikeMileageKm === undefined) return null;
  return Math.max(0, Math.round(bikeMileageKm - mileageAtInstall));
}

// ── Numbered spec list (Workshop Catalog) ─────────────────────────────────

function NumberedComponentList({
  components,
  isOwner,
  bikeMileageKm,
  onEdit,
  onDelete,
}: {
  components: ComponentItem[];
  isOwner: boolean;
  bikeMileageKm: number | undefined;
  onEdit: (c: ComponentItem) => void;
  onDelete: (id: string) => void;
}): React.JSX.Element {
  return (
    <ol className="component-list component-list--numbered">
      {components.map((component, index) => {
        const distanceKm = distanceRiddenKm(component.mileage_at_install, bikeMileageKm);
        return (
        <li key={component.id} className="component-list__row">
          <span className="component-list__number" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="component-list__name">
            <p className="component-list__type">{formatCategory(component.category)}</p>
            <p className="component-list__model">
              {[component.brand, component.name, component.model]
                .filter(Boolean)
                .join(' ')}
            </p>
          </div>

          <dl className="component-list__specs-dl">
            {component.installed_at !== null && component.installed_at !== '' && (
              <div className="component-list__spec-item">
                <dt>Installed</dt>
                <dd>{formatDate(component.installed_at)}</dd>
              </div>
            )}
            {distanceKm !== null && (
              <div className="component-list__spec-item">
                <dt>Distance</dt>
                <dd>{distanceKm.toLocaleString()} km</dd>
              </div>
            )}
          </dl>

          {isOwner && (
            <div className="component-list__actions">
              <button
                type="button"
                className="component-list__btn"
                onClick={() => onEdit(component)}
                aria-label={`Edit ${component.name}`}
              >
                Edit
              </button>
              <button
                type="button"
                className="component-list__btn component-list__btn--danger"
                onClick={() => onDelete(component.id)}
                aria-label={`Delete ${component.name}`}
              >
                Delete
              </button>
            </div>
          )}
        </li>
        );
      })}
    </ol>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ComponentList({
  components,
  onEdit,
  onDelete,
  isOwner,
  bikeMileageKm,
  numbered = false,
}: ComponentListProps): React.JSX.Element {
  if (components.length === 0) {
    return (
      <p className="component-list__empty">
        No components added yet.
      </p>
    );
  }

  if (numbered) {
    return (
      <NumberedComponentList
        components={components}
        isOwner={isOwner}
        bikeMileageKm={bikeMileageKm}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <div role="region" aria-label="Bike components">
      <table className="component-list__table">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Name</th>
            <th scope="col">Brand / Model</th>
            <th scope="col" className="component-list__col-installed">
              Installed
            </th>
            <th scope="col" className="component-list__col-mileage">
              Mileage at install
            </th>
            {isOwner && <th scope="col"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {components.map((component) => (
            <tr key={component.id}>
              <td>
                <span className="component-list__badge">
                  {formatCategory(component.category)}
                </span>
              </td>
              <td>{component.name}</td>
              <td>
                {component.brand !== null || component.model !== null
                  ? [component.brand, component.model].filter(Boolean).join(' / ')
                  : '—'}
              </td>
              <td className="component-list__col-installed">
                {formatDate(component.installed_at ?? null)}
              </td>
              <td className="component-list__col-mileage">
                {component.mileage_at_install !== null
                  ? `${component.mileage_at_install.toLocaleString()} km`
                  : '—'}
              </td>
              {isOwner && (
                <td>
                  <div className="component-list__actions">
                    <button
                      type="button"
                      className="component-list__btn"
                      onClick={() => onEdit(component)}
                      aria-label={`Edit ${component.name}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="component-list__btn component-list__btn--danger"
                      onClick={() => onDelete(component.id)}
                      aria-label={`Delete ${component.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
