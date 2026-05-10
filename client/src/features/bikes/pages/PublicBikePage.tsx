import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { fetchBike, type BikeItem } from '../api/bikes.api.js';
import { fetchComponents, type ComponentItem } from '../api/components.api.js';
import { PhotoGallery } from '../components/PhotoGallery.js';
import { ComponentList } from '../components/ComponentList.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { StatStrip } from '../../../components/ui/StatStrip.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './bikes-pages.css';

export function PublicBikePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();

  const [bike, setBike] = useState<BikeItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(null);
    setIsNotFound(false);

    async function loadData(): Promise<void> {
      try {
        const [bikeResult, componentsResult] = await Promise.all([
          fetchBike(id as string),
          fetchComponents(id as string),
        ]);

        if (controller.signal.aborted) return;

        setBike(bikeResult);
        setComponents(componentsResult);
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setLoadError(err instanceof Error ? err.message : 'Failed to load bike.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      controller.abort();
    };
  }, [id]);

  if (isLoading) {
    return (
      <main id="main" className="public-bike bikes-page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <Skeleton width="100%" height="2rem" />
          <Skeleton width="100%" height="18rem" />
          <Skeleton width="100%" height="12rem" />
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page">
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are looking for does not exist or is not available.</p>
        <Link to="/">Back to Home</Link>
      </main>
    );
  }

  if (loadError !== null) {
    return (
      <main id="main" className="bikes-page">
        <p className="bikes-page__error" role="alert">{loadError}</p>
        <Link to="/">Back to Home</Link>
      </main>
    );
  }

  if (!bike) return <></>;

  const publicStats = [
    { label: 'Frame', value: bike.type },
    { label: 'Year', value: String(bike.year) },
    { label: 'Brand', value: bike.brand },
    { label: 'Components', value: components.length },
  ];

  return (
    <main id="main" className="public-bike bikes-page">
      <PageHeader
        eyebrow={bike.type}
        title={bike.name}
        subtitle={`${bike.brand} · ${bike.year}`}
        variant="workshop"
        actions={
          <Link
            to={`/users/${bike.user_id}`}
            className="public-bike__owner"
            aria-label={`View owner's profile`}
          >
            View owner's profile
          </Link>
        }
      />

      <div className="public-bike__hero">
        <PhotoGallery
          heroImageUrl={bike.hero_image_url}
          isOwner={false}
          bikeName={bike.name}
        />
      </div>

      {bike.description !== null && bike.description !== '' && (
        <p className="bike-detail__description">{bike.description}</p>
      )}

      <div className="bike-detail__layout">
        <div className="bike-detail__main">
          <section aria-labelledby="public-specs">
            <h2 id="public-specs" className="section-heading">Specifications</h2>
            <ComponentList
              components={components}
              isOwner={false}
              numbered
              onEdit={() => undefined}
              onDelete={() => undefined}
            />
          </section>
        </div>

        <aside className="bike-detail__sidebar" aria-label="At a glance">
          <StatStrip stats={publicStats} orientation="vertical" />
        </aside>
      </div>
    </main>
  );
}
