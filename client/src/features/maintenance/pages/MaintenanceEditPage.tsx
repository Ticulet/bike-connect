import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchComponents, type ComponentItem } from '../../bikes/api/components.api.js';
import {
  fetchMaintenanceLogs,
  updateMaintenanceLog,
  type MaintenanceLogItem,
  type CreateMaintenancePayload,
} from '../api/maintenance.api.js';
import { MaintenanceForm } from '../components/MaintenanceForm.js';
import { ApiClientError } from '../../../lib/api-client.js';
import '../../bikes/pages/bikes-pages.css';

export function MaintenanceEditPage(): React.JSX.Element {
  const { bikeId, logId } = useParams<{ bikeId: string; logId: string }>();
  const navigate = useNavigate();

  const [log, setLog] = useState<MaintenanceLogItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function handleSubmit(data: CreateMaintenancePayload): Promise<void> {
    if (!bikeId || !logId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateMaintenanceLog(bikeId, logId, data);
      void navigate(`/my-bikes/${bikeId}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(`Failed to update maintenance record (${err.code}).`);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__loading" aria-live="polite">
          Loading...
        </p>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <h1 className="bikes-page__heading">Record Not Found</h1>
        <p>The maintenance record you are looking for does not exist.</p>
        <Link to={`/my-bikes/${bikeId ?? ''}`}>Back to Bike</Link>
      </main>
    );
  }

  if (loadError) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__error" role="alert">
          {loadError}
        </p>
        <Link to={`/my-bikes/${bikeId ?? ''}`}>Back to Bike</Link>
      </main>
    );
  }

  return (
    <main id="main" className="bikes-page bikes-page--narrow">
      <Link to={`/my-bikes/${bikeId ?? ''}`} className="bike-form-page__back">
        ← Back to Bike
      </Link>

      <h1 className="bikes-page__heading">Edit Maintenance Record</h1>

      {submitError && (
        <p className="bikes-page__error" role="alert">
          {submitError}
        </p>
      )}

      {log !== null && (
        <MaintenanceForm
          components={components}
          initialData={log}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      )}
    </main>
  );
}
