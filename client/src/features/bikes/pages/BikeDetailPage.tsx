import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { fetchBike, deleteBike, type BikeItem } from '../api/bikes.api.js';
import {
  fetchComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  type ComponentItem,
} from '../api/components.api.js';
import { ComponentList } from '../components/ComponentList.js';
import { ComponentForm } from '../components/ComponentForm.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { PhotoGallery } from '../components/PhotoGallery.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { apiClient, ApiClientError } from '../../../lib/api-client.js';
import type { CreateComponent } from '@bike-connect/shared';
import './bikes-pages.css';

type ComponentFormMode =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; component: ComponentItem };

export function BikeDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [bike, setBike] = useState<BikeItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [formMode, setFormMode] = useState<ComponentFormMode>({ type: 'closed' });
  const [isSubmittingComponent, setIsSubmittingComponent] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);

  const [deleteBikeOpen, setDeleteBikeOpen] = useState(false);
  const [isDeletingBike, setIsDeletingBike] = useState(false);
  const [deleteComponentId, setDeleteComponentId] = useState<string | null>(null);
  const [isDeletingComponent, setIsDeletingComponent] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setLoadError(null);
    setIsNotFound(false);

    try {
      const [bikeResult, componentsResult] = await Promise.all([
        fetchBike(id),
        fetchComponents(id),
      ]);

      if (controller.signal.aborted) return;

      setBike(bikeResult);
      setComponents(componentsResult);
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      if (err instanceof ApiClientError && err.status === 404) {
        setIsNotFound(true);
      } else {
        setLoadError(err instanceof Error ? err.message : 'Failed to load bike.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [id]);

  useEffect(() => {
    void loadData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadData]);

  const refreshComponents = useCallback(async () => {
    if (!id) return;
    try {
      const result = await fetchComponents(id);
      setComponents(result);
    } catch {
      setComponentError('Could not refresh component list.');
    }
  }, [id]);

  const isOwner = Boolean(user && bike && user.id === bike.user_id);

  async function handleHeroChange(url: string): Promise<void> {
    if (!id) return;
    try {
      const updated = await apiClient<BikeItem>(`/bikes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ hero_image_url: url }),
      });
      setBike(updated);
    } catch {
      // Non-critical — the upload already succeeded; the UI will still show the new URL
      // on next load. Silently ignore the persist error.
    }
  }

  async function handleDeleteBikeConfirm(): Promise<void> {
    if (!id) return;
    setIsDeletingBike(true);

    try {
      await deleteBike(id);
      void navigate('/my-bikes');
    } catch {
      setLoadError('Failed to delete bike. Please try again.');
      setDeleteBikeOpen(false);
    } finally {
      setIsDeletingBike(false);
    }
  }

  async function handleComponentSubmit(data: CreateComponent): Promise<void> {
    if (!id) return;

    setIsSubmittingComponent(true);
    setComponentError(null);

    try {
      if (formMode.type === 'edit') {
        await updateComponent(id, formMode.component.id, data);
      } else {
        await createComponent(id, data);
      }
      setFormMode({ type: 'closed' });
      await refreshComponents();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setComponentError(`Failed to save component (${err.code}).`);
      } else if (err instanceof Error) {
        setComponentError(err.message);
      } else {
        setComponentError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmittingComponent(false);
    }
  }

  async function handleDeleteComponentConfirm(): Promise<void> {
    if (!id || !deleteComponentId) return;
    setIsDeletingComponent(true);

    try {
      await deleteComponent(id, deleteComponentId);
      setDeleteComponentId(null);
      await refreshComponents();
    } catch {
      setComponentError('Failed to delete component. Please try again.');
      setDeleteComponentId(null);
    } finally {
      setIsDeletingComponent(false);
    }
  }

  if (isLoading) {
    return (
      <main id="main" className="bikes-page">
        <p className="bikes-page__loading" aria-live="polite">
          Loading bike...
        </p>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page">
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are looking for does not exist or is not available.</p>
        <Link to="/my-bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (loadError) {
    return (
      <main id="main" className="bikes-page">
        <p className="bikes-page__error" role="alert">
          {loadError}
        </p>
        <Link to="/my-bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (!bike) return <></>;

  const deleteComponentTarget = components.find((c) => c.id === deleteComponentId);

  return (
    <main id="main" className="bikes-page">
      <Link to="/my-bikes" className="bike-form-page__back">
        ← My Bikes
      </Link>

      <PhotoGallery
        heroImageUrl={bike.hero_image_url}
        isOwner={isOwner}
        bikeName={bike.name}
        onHeroChange={(url) => void handleHeroChange(url)}
      />

      <div className="bike-detail__meta">
        <span className="bike-detail__badge bike-detail__badge--type">{bike.type}</span>
        <span
          className={`bike-detail__badge ${bike.is_public ? 'bike-detail__badge--public' : 'bike-detail__badge--private'}`}
        >
          {bike.is_public ? 'Public' : 'Private'}
        </span>
      </div>

      <h1 className="bikes-page__heading">{bike.name}</h1>

      <p className="bike-detail__subtitle">
        {bike.brand} {bike.model} &mdash; {bike.year}
      </p>

      {bike.description && (
        <p className="bike-detail__description">{bike.description}</p>
      )}

      {isOwner && (
        <div className="bike-detail__owner-actions">
          <Link to={`/my-bikes/${bike.id}/edit`} className="bike-detail__edit-link">
            Edit Bike
          </Link>
          <button
            type="button"
            className="bike-detail__delete-btn"
            onClick={() => setDeleteBikeOpen(true)}
          >
            Delete Bike
          </button>
        </div>
      )}

      <section className="bike-detail__section" aria-labelledby="components-heading">
        <div className="bike-detail__section-header">
          <h2 id="components-heading" className="bikes-page__subheading">
            Components
          </h2>
          {isOwner && formMode.type === 'closed' && (
            <button
              type="button"
              className="bike-detail__add-component-btn"
              onClick={() => setFormMode({ type: 'add' })}
            >
              + Add Component
            </button>
          )}
        </div>

        {componentError && (
          <p className="bikes-page__error" role="alert">
            {componentError}
          </p>
        )}

        {formMode.type !== 'closed' && (
          <div className="bike-detail__component-form-wrapper">
            <ComponentForm
              initialValues={
                formMode.type === 'edit'
                  ? {
                      category: formMode.component.category,
                      name: formMode.component.name,
                      brand: formMode.component.brand ?? '',
                      model: formMode.component.model ?? '',
                      installed_at: formMode.component.installed_at ?? '',
                      mileage_at_install:
                        formMode.component.mileage_at_install !== null
                          ? String(formMode.component.mileage_at_install)
                          : '',
                      notes: formMode.component.notes ?? '',
                    }
                  : undefined
              }
              onSubmit={(data) => void handleComponentSubmit(data)}
              onCancel={() => {
                setFormMode({ type: 'closed' });
                setComponentError(null);
              }}
              isSubmitting={isSubmittingComponent}
            />
          </div>
        )}

        <ComponentList
          components={components}
          isOwner={isOwner}
          onEdit={(component) => {
            setFormMode({ type: 'edit', component });
            setComponentError(null);
          }}
          onDelete={(componentId) => setDeleteComponentId(componentId)}
        />
      </section>

      <ConfirmDialog
        isOpen={deleteBikeOpen}
        title="Delete Bike"
        message={`Are you sure you want to delete "${bike.name}"? All components will also be removed. This action cannot be undone.`}
        confirmLabel={isDeletingBike ? 'Deleting...' : 'Delete'}
        onConfirm={() => void handleDeleteBikeConfirm()}
        onCancel={() => setDeleteBikeOpen(false)}
      />

      <ConfirmDialog
        isOpen={deleteComponentId !== null}
        title="Delete Component"
        message={
          deleteComponentTarget
            ? `Are you sure you want to delete "${deleteComponentTarget.name}"? This action cannot be undone.`
            : 'Are you sure you want to delete this component? This action cannot be undone.'
        }
        confirmLabel={isDeletingComponent ? 'Deleting...' : 'Delete'}
        onConfirm={() => void handleDeleteComponentConfirm()}
        onCancel={() => setDeleteComponentId(null)}
      />
    </main>
  );
}
