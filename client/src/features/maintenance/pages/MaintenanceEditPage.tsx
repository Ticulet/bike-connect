import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchComponents, type ComponentItem } from '../../bikes/api/components.api.js';
import {
  fetchMaintenanceLogs,
  type MaintenanceLogItem,
} from '../api/maintenance.api.js';
import { MaintenanceForm } from '../components/MaintenanceForm.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { ApiClientError } from '../../../lib/api-client.js';
import { useToast } from '../../../components/ui/useToast.js';
import '../../bikes/pages/bikes-pages.css';

export function MaintenanceEditPage(): React.JSX.Element {
  const { bikeId, logId } = useParams<{ bikeId: string; logId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [log, setLog] = useState<MaintenanceLogItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!bikeId || !logId) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(null);
    setIsNotFound(false);

    Promise.all([fetchMaintenanceLogs(bikeId), fetchComponents(bikeId)])
      .then(([logs, comps]) => {
        if (controller.signal.aborted) return;

        const found = logs.find((l) => l.id === logId);
        if (found === undefined) {
          setIsNotFound(true);
          return;
        }

        setLog(found);
        setComponents(comps);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiClientError && err.status === 404) {
          setIsNotFound(true);
        } else {
          setLoadError(
            err instanceof Error ? err.message : 'Failed to load maintenance data.',
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
  }, [bikeId, logId]);

  function handleSuccess(_entry: MaintenanceLogItem): void {
    toast.success('Maintenance entry updated.');
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
        <h1 className="bikes-page__heading">Record Not Found</h1>
        <p>The maintenance record you are looking for does not exist.</p>
        <Link to={`/me/bikes/${bikeId ?? ''}`}>Back to Bike</Link>
      </main>
    );
  }

  if (loadError !== null) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__error" role="alert">{loadError}</p>
        <Link to={`/me/bikes/${bikeId ?? ''}`}>Back to Bike</Link>
      </main>
    );
  }

  return (
    <main id="main" className="bike-form-page bikes-page bikes-page--narrow">
      <Link to={`/me/bikes/${bikeId ?? ''}`} className="bike-form-page__back">
        ← Back to Bike
      </Link>

      <PageHeader
        eyebrow="Maintenance"
        title="Edit entry"
        variant="workshop"
      />

      {log !== null && (
        <MaintenanceForm
          bikeId={bikeId ?? ''}
          logId={logId}
          components={components}
          initialData={log}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      )}
    </main>
  );
}
