import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import type { CreateBike } from '@bike-connect/shared';
import { fetchBike, updateBike, type BikeItem } from '../api/bikes.api.js';
import { BikeForm } from '../components/BikeForm.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './bikes-pages.css';

export function BikeEditPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [bike, setBike] = useState<BikeItem | null>(null);
  const [isLoadingBike, setIsLoadingBike] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingBike(true);
    setLoadError(null);
    setIsNotFound(false);

    fetchBike(id)
      .then((result) => {
        if (controller.signal.aborted) return;
        setBike(result);
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
          setIsLoadingBike(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [id]);

  async function handleSubmit(data: CreateBike): Promise<void> {
    if (!id) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await updateBike(id, data);
      void navigate(`/my-bikes/${id}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(`Failed to update bike (${err.code}).`);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingBike) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <p className="bikes-page__loading" aria-live="polite">
          Loading bike...
        </p>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page bikes-page--narrow">
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are trying to edit does not exist.</p>
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
      <Link to={`/my-bikes/${id ?? ''}`} className="bike-form-page__back">
        ← Back to Bike
      </Link>

      <h1 className="bikes-page__heading">Edit Bike</h1>

      {submitError && (
        <p className="bikes-page__error" role="alert">
          {submitError}
        </p>
      )}

      {bike && (
        <BikeForm
          initialValues={{
            name: bike.name,
            brand: bike.brand,
            model: bike.model,
            year: String(bike.year),
            type: bike.type,
            description: bike.description ?? '',
            is_public: bike.is_public,
          }}
          onSubmit={(data) => void handleSubmit(data)}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      )}
    </main>
  );
}
