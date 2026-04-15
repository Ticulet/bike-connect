import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchMyBikes, deleteBike, type BikeItem } from '../api/bikes.api.js';
import { BikeCard } from '../components/BikeCard.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import './bikes-pages.css';

export function MyBikesPage(): React.JSX.Element {
  const [bikes, setBikes] = useState<BikeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadBikes = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchMyBikes();
      if (controller.signal.aborted) return;
      setBikes(result);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load bikes.');
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadBikes();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadBikes]);

  async function handleDeleteConfirm(): Promise<void> {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      await deleteBike(deleteTargetId);
      setBikes((prev) => prev.filter((b) => b.id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch {
      setError('Failed to delete bike. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  const deleteTarget = bikes.find((b) => b.id === deleteTargetId);

  return (
    <main id="main" className="bikes-page">
      <div className="my-bikes-page__toolbar">
        <h1 className="bikes-page__heading">My Bikes</h1>
        <Link to="/my-bikes/new" className="my-bikes-page__new-link">
          + Add Bike
        </Link>
      </div>

      {error && (
        <p className="bikes-page__error" role="alert">
          {error}
        </p>
      )}

      {isLoading && (
        <p className="bikes-page__loading" aria-live="polite">
          Loading your bikes...
        </p>
      )}

      {!isLoading && bikes.length === 0 && !error && (
        <div className="bikes-page__empty">
          <p>You have no bikes yet.</p>
          <Link to="/my-bikes/new">Add your first bike</Link>
        </div>
      )}

      {!isLoading && (
        <p className="sr-only" aria-live="polite">
          {bikes.length === 0 ? 'No bikes found.' : `${bikes.length} bike${bikes.length === 1 ? '' : 's'} loaded.`}
        </p>
      )}

      {!isLoading && bikes.length > 0 && (
        <div className="my-bikes-page__grid">
          {bikes.map((bike) => (
            <div key={bike.id} className="my-bikes-page__card-wrapper">
              <BikeCard bike={bike} />
              <div className="my-bikes-page__card-actions">
                <Link to={`/my-bikes/${bike.id}/edit`} className="my-bikes-page__edit-link" aria-label={`Edit ${bike.name}`}>
                  Edit
                </Link>
                <button
                  type="button"
                  className="my-bikes-page__delete-btn"
                  onClick={() => setDeleteTargetId(bike.id)}
                  aria-label={`Delete ${bike.name}`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Bike"
        message={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this bike? This action cannot be undone.'
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setDeleteTargetId(null)}
      />
    </main>
  );
}
