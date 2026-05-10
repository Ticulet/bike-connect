import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchBike } from '../../bikes/api/bikes.api.js';
import { fetchComponents, type ComponentItem } from '../../bikes/api/components.api.js';
import type { MaintenanceLogItem } from '../api/maintenance.api.js';
import { MaintenanceForm } from '../components/MaintenanceForm.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { useToast } from '../../../components/ui/useToast.js';
import '../../bikes/pages/bikes-pages.css';

export function MaintenanceCreatePage(): React.JSX.Element {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [bikeName, setBikeName] = useState<string | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
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

    Promise.all([fetchBike(bikeId), fetchComponents(bikeId)])
      .then(([bike, comps]) => {
        if (controller.signal.aborted) return;
        setBikeName(bike.name);
        setComponents(comps);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load bike data.',
          );
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

  function handleSuccess(_entry: MaintenanceLogItem): void {
    toast.success('Maintenance entry logged.');
    void navigate(`/me/bikes/${bikeId ?? ''}`);
  }

  function handleCancel(): void {
    void navigate(`/me/bikes/${bikeId ?? ''}`);
  }

  if (isLoading) {
    return (
      <main id="main" className="bike-form-page bikes-page bikes-page--narrow">
        <Skeleton width="100%" height="2rem" />
        <Skeleton width="100%" height="24rem" />
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
        eyebrow="Maintenance"
        title="Log entry"
        variant="workshop"
      />

      <MaintenanceForm
        bikeId={bikeId ?? ''}
        components={components}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </main>
  );
}
