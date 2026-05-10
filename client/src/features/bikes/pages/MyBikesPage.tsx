import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { fetchMyBikes, deleteBike, type BikeItem } from '../api/bikes.api.js';
import { BikeCard } from '../components/BikeCard.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import './bikes-pages.css';

// ── Icons ──────────────────────────────────────────────────────────────────

function PlusIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BikeEmptyIcon(): React.JSX.Element {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <circle cx="14" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="34" cy="32" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14 32L20 16h8l6 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 16h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Skeleton rows ──────────────────────────────────────────────────────────

function BikesSkeleton(): React.JSX.Element {
  return (
    <ul className="my-bikes__list" aria-busy="true" aria-label="Loading bikes">
      {[1, 2, 3].map((n) => (
        <li key={n} className="my-bikes__skeleton-row">
          <Skeleton width="15rem" height="9.375rem" />
          <div className="my-bikes__skeleton-body">
            <Skeleton width="6rem" height="0.75rem" />
            <Skeleton width="14rem" height="1.5rem" />
            <Skeleton width="10rem" height="0.875rem" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

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
    <main id="main" className="my-bikes">
      <PageHeader
        eyebrow="Your garage"
        title="Bikes"
        subtitle={isLoading ? undefined : `${bikes.length} registered`}
        variant="workshop"
        actions={
          <Link to="/me/bikes/new" className="btn btn-primary my-bikes__add-btn">
            <PlusIcon /> Add bike
          </Link>
        }
      />

      {error && (
        <p className="bikes-page__error" role="alert">{error}</p>
      )}

      {isLoading ? (
        <BikesSkeleton />
      ) : bikes.length === 0 && !error ? (
        <EmptyState
          icon={<BikeEmptyIcon />}
          title="No bikes yet"
          description="Register your first ride to start tracking miles and maintenance."
          action={
            <Link to="/me/bikes/new" className="btn btn-primary">Add your first bike</Link>
          }
        />
      ) : (
        <ul className="my-bikes__list">
          {bikes.map((bike) => (
            <li key={bike.id} className="my-bikes__item">
              <BikeCard bike={bike} variant="workshop" />
              <div className="my-bikes__card-actions">
                <button
                  type="button"
                  className="my-bikes-page__delete-btn"
                  onClick={() => setDeleteTargetId(bike.id)}
                  aria-label={`Delete ${bike.name}`}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
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
