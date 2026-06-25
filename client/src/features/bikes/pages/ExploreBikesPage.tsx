import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchExploreBikes, type BikeWithOwner } from '../api/explore.api.js';
import { BIKE_TYPES } from '@bike-connect/shared';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import { Avatar } from '../../../components/ui/Avatar.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { Link } from 'react-router';
import './bikes-pages.css';

/* ------------------------------------------------------------------ */
/* Inline SVG icons                                                     */
/* ------------------------------------------------------------------ */

function BikeEmptyIcon(): React.JSX.Element {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="12" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 28L20 14L28 28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 14H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* FilterGroup component                                                */
/* ------------------------------------------------------------------ */

interface FilterGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
}

function FilterGroup({ label, options, value, onChange }: FilterGroupProps): React.JSX.Element {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group__legend">{label}</legend>
      <div className="filter-group__chips">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className="chip"
            aria-pressed={value === o.value}
            onClick={() => { onChange(value === o.value ? null : o.value); }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/* ------------------------------------------------------------------ */
/* BikeCard (explore variant)                                           */
/* ------------------------------------------------------------------ */

function ExploreBikeCard({ bike }: { bike: BikeWithOwner }): React.JSX.Element {

  return (
    <article className="bike-card explore-bike-card">
      <Link
        to={`/bikes/${bike.id}`}
        className="bike-card__link"
        aria-label={`View ${bike.name} by ${bike.owner_display_name}`}
      >
        {isSafeImageUrl(bike.hero_image_url) ? (
          <img
            className="bike-card__image"
            src={bike.hero_image_url}
            alt={`${bike.name} hero image`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="bike-card__image-placeholder" aria-hidden="true">
            <BikeEmptyIcon />
          </div>
        )}
      </Link>

      <div className="bike-card__body">
        <div className="bike-card__header">
          <h2 className="bike-card__name">
            <Link to={`/bikes/${bike.id}`} className="bike-card__name-link">
              {bike.name}
            </Link>
          </h2>
          <span className="bike-card__badge bike-card__badge--type">{bike.type}</span>
        </div>

        <p className="bike-card__subtitle">
          {bike.brand} {bike.model}, {bike.year}
        </p>

        <div className="explore-bike-card__owner">
          <Avatar
            src={bike.owner_avatar_url}
            name={bike.owner_display_name}
            className="explore-bike-card__owner-avatar"
            fallbackClassName="explore-bike-card__owner-avatar-placeholder"
          />
          <span className="explore-bike-card__owner-name">{bike.owner_display_name}</span>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeleton                                                     */
/* ------------------------------------------------------------------ */

function BikesLoadingSkeleton(): React.JSX.Element {
  return (
    <div className="explore-bikes__skeletons" aria-busy="true" aria-label="Loading bikes">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} variant="card" height={220} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter options                                                       */
/* ------------------------------------------------------------------ */

const FRAME_TYPE_OPTIONS = BIKE_TYPES.map((t) => ({
  value: t,
  label: t.charAt(0).toUpperCase() + t.slice(1),
}));

// Discipline is a client-side filter (the API supports type only)
const DISCIPLINE_OPTIONS: { value: string; label: string }[] = [
  { value: 'commute', label: 'Commute' },
  { value: 'race', label: 'Race' },
  { value: 'trail', label: 'Trail' },
  { value: 'touring', label: 'Touring' },
];

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */

interface Filters {
  frameType: string | null;
  discipline: string | null;
}

const EMPTY_FILTERS: Filters = { frameType: null, discipline: null };

export function ExploreBikesPage(): React.JSX.Element {
  const [allBikes, setAllBikes] = useState<BikeWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const abortRef = useRef<AbortController | null>(null);

  const loadBikes = useCallback(async (frameType: string | null, cursor?: string): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!cursor) {
      setIsLoading(true);
      setAllBikes([]);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const result = await fetchExploreBikes({
        type: frameType ?? undefined,
        cursor,
        limit: 24,
      });

      if (controller.signal.aborted) return;

      if (cursor) {
        setAllBikes((prev) => [...prev, ...result.data]);
      } else {
        setAllBikes(result.data);
      }
      setNextCursor(result.pagination.next_cursor);
      setHasMore(result.pagination.has_more);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load bikes.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBikes(filters.frameType);
    return () => { abortRef.current?.abort(); };
  }, [loadBikes, filters.frameType]);

  function handleFrameTypeChange(value: string | null): void {
    setFilters((prev) => ({ ...prev, frameType: value }));
  }

  function handleDisciplineChange(value: string | null): void {
    setFilters((prev) => ({ ...prev, discipline: value }));
  }

  function resetFilters(): void {
    setFilters(EMPTY_FILTERS);
  }

  function handleLoadMore(): void {
    if (nextCursor) {
      void loadBikes(filters.frameType, nextCursor);
    }
  }

  // Client-side discipline filtering (the API only supports type)
  const bikes = allBikes.filter((b) => {
    if (filters.discipline !== null) {
      // Discipline is a best-effort client-side filter based on bike type mapping
      const disciplineTypeMap: Record<string, string[]> = {
        commute: ['urban'],
        race: ['road'],
        trail: ['mtb', 'gravel'],
        touring: ['touring'],
      };
      const types = disciplineTypeMap[filters.discipline];
      if (types && !types.includes(b.type)) return false;
    }
    return true;
  });

  const hasActiveFilters = filters.frameType !== null || filters.discipline !== null;

  return (
    <div className="explore-bikes">
      <PageHeader
        eyebrow="Explore"
        title="Bikes"
        subtitle="Browse what the community is riding."
        variant="editorial"
      />

      <div className="explore-bikes__layout">
        <aside className="explore-bikes__filters" aria-label="Filter bikes">
          <FilterGroup
            label="Frame type"
            options={FRAME_TYPE_OPTIONS}
            value={filters.frameType}
            onChange={handleFrameTypeChange}
          />
          <FilterGroup
            label="Discipline"
            options={DISCIPLINE_OPTIONS}
            value={filters.discipline}
            onChange={handleDisciplineChange}
          />
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-ghost filter-group__reset"
              onClick={resetFilters}
            >
              Reset filters
            </button>
          )}
        </aside>

        <div className="explore-bikes__main">
          <div className="explore-bikes__toolbar">
            <p className="explore-bikes__count">
              {isLoading ? <>&nbsp;</> : `${bikes.length} bike${bikes.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {error && (
            <p className="bikes-page__error" role="alert">{error}</p>
          )}

          {isLoading ? (
            <BikesLoadingSkeleton />
          ) : bikes.length === 0 ? (
            <EmptyState
              icon={<BikeEmptyIcon />}
              title="No bikes match those filters"
              description="Try clearing a filter or two."
              action={
                hasActiveFilters ? (
                  <button type="button" className="btn btn-ghost" onClick={resetFilters}>
                    Reset filters
                  </button>
                ) : undefined
              }
            />
          ) : (
            <ul
              className="explore-bikes__list explore-bikes__list--grid"
              role="list"
              aria-label="Explore bikes"
            >
              {bikes.map((bike) => (
                <li key={bike.id}>
                  <ExploreBikeCard bike={bike} />
                </li>
              ))}
            </ul>
          )}

          {hasMore && !isLoading && (
            <div className="explore-bikes__load-more">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                aria-busy={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
