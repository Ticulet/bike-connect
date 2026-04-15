import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import type { CreateBike } from '@bike-connect/shared';
import { createBike } from '../api/bikes.api.js';
import { BikeForm } from '../components/BikeForm.js';
import { ApiClientError } from '../../../lib/api-client.js';
import './bikes-pages.css';

export function BikeCreatePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(data: CreateBike): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const created = await createBike(data);
      void navigate(`/my-bikes/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setSubmitError(`Failed to create bike (${err.code}).`);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main id="main" className="bikes-page bikes-page--narrow">
      <Link to="/my-bikes" className="bike-form-page__back">
        ← My Bikes
      </Link>

      <h1 className="bikes-page__heading">Add New Bike</h1>

      {submitError && (
        <p className="bikes-page__error" role="alert">
          {submitError}
        </p>
      )}

      <BikeForm
        onSubmit={(data) => void handleSubmit(data)}
        isSubmitting={isSubmitting}
        submitLabel="Add Bike"
      />
    </main>
  );
}
