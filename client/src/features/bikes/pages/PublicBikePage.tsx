import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { fetchBike, type BikeItem } from '../api/bikes.api.js';
import { fetchComponents, type ComponentItem } from '../api/components.api.js';
import { PhotoGallery } from '../components/PhotoGallery.js';
import { ComponentList } from '../components/ComponentList.js';
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
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load bike.',
          );
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
      <main id="main" className="bikes-page">
        <p className="bikes-page__loading" aria-live="polite">
          Loading bike...
        </p>
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

  if (loadError) {
    return (
      <main id="main" className="bikes-page">
        <p className="bikes-page__error" role="alert">
          {loadError}
        </p>
        <Link to="/">Back to Home</Link>
      </main>
    );
  }

  if (!bike) return <></>;

  return (
    <main id="main" className="bikes-page">
      <PhotoGallery
        heroImageUrl={bike.hero_image_url}
        isOwner={false}
        bikeName={bike.name}
      />

      <div className="bike-detail__meta">
        <span className="bike-detail__badge bike-detail__badge--type">
          {bike.type}
        </span>
      </div>

      <h1 className="bikes-page__heading">{bike.name}</h1>

      <p className="bike-detail__subtitle">
        {bike.brand} {bike.model} &mdash; {bike.year}
      </p>

      {bike.description && (
        <p className="bike-detail__description">{bike.description}</p>
      )}

      <p className="bike-detail__owner-link">
        <Link to={`/users/${bike.user_id}`}>View owner&rsquo;s profile</Link>
      </p>

      <section
        className="bike-detail__section"
        aria-labelledby="components-heading"
      >
        <h2 id="components-heading" className="bikes-page__subheading">
          Components
        </h2>
        <ComponentList
          components={components}
          isOwner={false}
          onEdit={() => undefined}
          onDelete={() => undefined}
        />
      </section>
    </main>
  );
}
