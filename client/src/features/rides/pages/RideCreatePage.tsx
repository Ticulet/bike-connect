import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchBike } from '../../bikes/api/bikes.api.js';
import type { RideItem } from '../api/rides.api.js';
import { RideForm } from '../components/RideForm.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { useToast } from '../../../components/ui/useToast.js';
import '../../bikes/pages/bikes-pages.css';

export function RideCreatePage(): React.JSX.Element {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [bikeName, setBikeName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!bikeId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(null);
    setIsNotFound(false);

    fetchBike(bikeId)
      .then((bike) => {
        if (controller.signal.aborted) return;
        setBikeName(bike.name);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setLoadError(err instanceof Error ? err.message : 'Failed to load bike.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [bikeId]);

  function handleSuccess(_entry: RideItem): void {
    toast.success('Ride logged.');
    void navigate(`/me/bikes/${bikeId ?? ''}`);
  }

  function handleCancel(): void {
    void navigate(`/me/bikes/${bikeId ?? ''}`);
  }

  if (isLoading) {
    return (
      <main id="main" className="bike-form-page bikes-page bikes-page--narrow">
        <Skeleton width="100%" height="2rem" />
        <Skeleton width="100%" height="20rem" />
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are looking for does not exist or is not available.</p>
        <Link to="/me/bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (loadError !== null) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__error" role="alert">{loadError}</p>
        <Link to="/me/bikes">Back to My Bikes</Link>
      </main>
    );
  }

  return (
    <main id="main" className="bike-form-page bikes-page bikes-page--narrow">
      <Link to={`/me/bikes/${bikeId ?? ''}`} className="bike-form-page__back">
        ← Back to {bikeName ?? 'Bike'}
      </Link>

      <PageHeader
        eyebrow="Rides"
        title="Log a ride"
        variant="workshop"
      />

      <RideForm
        bikeId={bikeId ?? ''}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </main>
  );
}
