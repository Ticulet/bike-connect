import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import type { CreateBike } from '@bike-connect/shared';
import { fetchBike, updateBike, type BikeItem } from '../api/bikes.api.js';
import { BikeForm } from '../components/BikeForm.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
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
      void navigate(`/me/bikes/${id}`);
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
        <p>The bike you are trying to edit does not exist.</p>
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
      <Link to={`/me/bikes/${id ?? ''}`} className="bike-form-page__back">
        ← Back to Bike
      </Link>

      <PageHeader
        eyebrow="Edit"
        title={bike?.name ?? 'Edit bike'}
        variant="workshop"
      />

      {submitError !== null && (
        <p className="bikes-page__error" role="alert">
          {submitError}
        </p>
      )}

      {bike !== null && (
        <BikeForm
          initialValues={{
            name: bike.name,
            brand: bike.brand,
            model: bike.model,
            year: String(bike.year),
            type: bike.type,
            description: bike.description ?? '',
            heroImageUrl: bike.hero_image_url ?? '',
            is_public: bike.is_public,
          }}
          onSubmit={(data) => void handleSubmit(data)}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
        />
      )}
    </main>
  );
}
