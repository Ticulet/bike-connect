import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchBike } from '../../bikes/api/bikes.api.js';
import { createRide, type CreateRidePayload } from '../api/rides.api.js';
import { RideForm } from '../components/RideForm.js';
import { ApiClientError } from '../../../lib/api-client.js';
import '../../bikes/pages/bikes-pages.css';

export function RideCreatePage(): React.JSX.Element {
  const { bikeId } = useParams<{ bikeId: string }>();
  const navigate = useNavigate();

  const [bikeName, setBikeName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  async function handleSubmit(data: CreateRidePayload): Promise<void> {
    if (!bikeId) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createRide(bikeId, data);
      void navigate(`/my-bikes/${bikeId}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(`Failed to log ride (${err.code}).`);
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
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are looking for does not exist or is not available.</p>
        <Link to="/my-bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (loadError) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__error" role="alert">
          {loadError}
        </p>
        <Link to="/my-bikes">Back to My Bikes</Link>
      </main>
    );
  }

  return (
    <main id="main" className="bikes-page bikes-page--narrow">
      <Link to={`/my-bikes/${bikeId ?? ''}`} className="bike-form-page__back">
        ← Back to {bikeName ?? 'Bike'}
      </Link>

      <h1 className="bikes-page__heading">Log a Ride</h1>

      {submitError && (
        <p className="bikes-page__error" role="alert">
          {submitError}
        </p>
      )}

      <RideForm
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Log Ride"
      />
    </main>
  );
}
