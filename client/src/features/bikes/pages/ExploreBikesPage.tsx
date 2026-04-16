import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchExploreBikes, type BikeWithOwner } from '../api/explore.api.js';
import { BIKE_TYPES } from '@bike-connect/shared';
import { isSafeImageUrl } from '../../../lib/safe-url.js';
import './bikes-pages.css';

function ExploreBikeCard({ bike }: { bike: BikeWithOwner }): React.JSX.Element {
  const ownerInitial = bike.owner_display_name.charAt(0).toUpperCase();

  return (
    <article className="bike-card">
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
          />
        ) : (
          <div className="bike-card__image-placeholder" aria-hidden="true">
            🚲
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
          <div className="bike-card__badges">
            <span className="bike-card__badge bike-card__badge--type">{bike.type}</span>
          </div>
        </div>

        <p className="bike-card__subtitle">
          {bike.brand} {bike.model} &mdash; {bike.year}
        </p>

        <div className="explore-bike-card__owner">
          {isSafeImageUrl(bike.owner_avatar_url) ? (
            <img
              src={bike.owner_avatar_url}
              alt=""
              className="explore-bike-card__owner-avatar"
              aria-hidden="true"
            />
          ) : (
            <div className="explore-bike-card__owner-avatar-placeholder" aria-hidden="true">
              {ownerInitial}
            </div>
          )}
          <span className="explore-bike-card__owner-name">{bike.owner_display_name}</span>
        </div>
      </div>
    </article>
  );
}

export function ExploreBikesPage(): React.JSX.Element {
  const [bikes, setBikes] = useState<BikeWithOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('');

  const abortRef = useRef<AbortController | null>(null);

  const loadBikes = useCallback(async (type: string, cursor?: string): Promise<void> => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!cursor) {
      setIsLoading(true);
      setBikes([]);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const result = await fetchExploreBikes({
        type: type || undefined,
        cursor,
        limit: 12,
      });

      if (controller.signal.aborted) return;

      if (cursor) {
        setBikes((prev) => [...prev, ...result.data]);
      } else {
        setBikes(result.data);
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
    void loadBikes(selectedType);
    return () => {
      abortRef.current?.abort();
    };
  }, [loadBikes, selectedType]);

  function handleTypeChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    setSelectedType(event.target.value);
  }

  function handleLoadMore(): void {
    if (nextCursor) {
      void loadBikes(selectedType, nextCursor);
    }
  }

  return (
    <main id="main" className="bikes-page">
      <div className="explore-bikes-page__header">
        <h1 className="bikes-page__heading">Explore Bikes</h1>

        <div className="explore-bikes-page__filters">
          <label htmlFor="explore-type-filter" className="explore-bikes-page__filter-label">
            Filter by type
          </label>
          <select
            id="explore-type-filter"
            className="explore-bikes-page__filter-select"
            value={selectedType}
            onChange={handleTypeChange}
            aria-label="Filter bikes by type"
          >
            <option value="">All types</option>
            {BIKE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="bikes-page__error" role="alert">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="bikes-page__loading" aria-live="polite">
          Loading bikes...
        </p>
      )}

      {!isLoading && bikes.length === 0 && !error && (
        <div className="bikes-page__empty">
          <p>No bikes found{selectedType ? ` for type "${selectedType}"` : ''}.</p>
        </div>
      )}

      {!isLoading && bikes.length > 0 && (
        <>
          <div className="my-bikes-page__grid" role="list" aria-label="Explore bikes">
            {bikes.map((bike) => (
              <div key={bike.id} role="listitem">
                <ExploreBikeCard bike={bike} />
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="explore-bikes-page__load-more">
              <button
                type="button"
                className="explore-bikes-page__load-more-btn"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                aria-busy={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
