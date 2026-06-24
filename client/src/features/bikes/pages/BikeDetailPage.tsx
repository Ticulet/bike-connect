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
import { PageHeader } from '../../../components/ui/PageHeader.js';
import { StatStrip } from '../../../components/ui/StatStrip.js';
import { Skeleton } from '../../../components/ui/Skeleton.js';
import { PhotoGallery } from '../components/PhotoGallery.js';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { apiClient, ApiClientError } from '../../../lib/api-client.js';
import { useToast } from '../../../components/ui/useToast.js';
import type { CreateComponent } from '@bike-connect/shared';
import {
  fetchMaintenanceLogs,
  deleteMaintenanceLog,
  type MaintenanceLogItem,
} from '../../maintenance/api/maintenance.api.js';
import { MaintenanceTimeline } from '../../maintenance/components/MaintenanceTimeline.js';
import { MaintenanceFormDrawer } from '../../maintenance/components/MaintenanceFormDrawer.js';
import {
  fetchRides,
  fetchRideStats,
  deleteRide,
  type RideItem,
  type RideStats as RideStatsData,
} from '../../rides/api/rides.api.js';
import { RideList } from '../../rides/components/RideList.js';
import { RideStats } from '../../rides/components/RideStats.js';
import { RideFormDrawer } from '../../rides/components/RideFormDrawer.js';
import { fetchReminders, type ComponentReminder } from '../../reminders/api/reminders.api.js';
import { ReminderList } from '../../reminders/components/ReminderList.js';
import './bikes-pages.css';

// PlusIcon — hand-rolled SVG
function PlusIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type ComponentFormMode =
  | { type: 'closed' }
  | { type: 'add' }
  | { type: 'edit'; component: ComponentItem };

type MaintenanceDrawerMode =
  | { open: false }
  | { open: true; logId?: string; initialData?: MaintenanceLogItem };

type RideDrawerMode =
  | { open: false }
  | { open: true; rideId?: string; initialData?: RideItem };

function formatKm(km: number | undefined): string {
  if (km === undefined) return '-';
  return `${km.toLocaleString()} km`;
}

function formatRelative(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function BikeDetailPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [bike, setBike] = useState<BikeItem | null>(null);
  const [components, setComponents] = useState<ComponentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState(false);

  const [formMode, setFormMode] = useState<ComponentFormMode>({ type: 'closed' });
  const [isSubmittingComponent, setIsSubmittingComponent] = useState(false);
  const [componentError, setComponentError] = useState<string | null>(null);

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLogItem[]>([]);
  const [maintenanceError, setMaintenanceError] = useState<string | null>(null);
  const [maintenanceDrawer, setMaintenanceDrawer] = useState<MaintenanceDrawerMode>({ open: false });

  const [rides, setRides] = useState<RideItem[]>([]);
  const [rideStats, setRideStats] = useState<RideStatsData | null>(null);
  const [ridesError, setRidesError] = useState<string | null>(null);
  const [deleteRideId, setDeleteRideId] = useState<string | null>(null);
  const [isDeletingRide, setIsDeletingRide] = useState(false);
  const [rideDrawer, setRideDrawer] = useState<RideDrawerMode>({ open: false });

  const [reminders, setReminders] = useState<ComponentReminder[]>([]);
  const [remindersError, setRemindersError] = useState<string | null>(null);

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
      const [bikeResult, componentsResult, maintenanceResult, ridesResult, rideStatsResult, remindersResult] =
        await Promise.all([
          fetchBike(id),
          fetchComponents(id),
          fetchMaintenanceLogs(id),
          fetchRides(id).catch((): RideItem[] | 'error' => 'error'),
          fetchRideStats(id).catch((): RideStatsData | null | 'error' => 'error'),
          fetchReminders(id).catch((): ComponentReminder[] | 'error' => 'error'),
        ]);

      if (controller.signal.aborted) return;

      setBike(bikeResult);
      setComponents(componentsResult);
      setMaintenanceLogs(maintenanceResult);

      if (ridesResult === 'error') {
        setRides([]);
        setRidesError('Could not load ride history.');
      } else {
        setRides(ridesResult);
      }

      if (rideStatsResult === 'error') {
        setRideStats(null);
      } else {
        setRideStats(rideStatsResult);
      }

      if (remindersResult === 'error') {
        setReminders([]);
        setRemindersError('Could not load maintenance reminders.');
      } else {
        setReminders(remindersResult);
      }
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

  async function handleDeleteLog(logId: string): Promise<void> {
    if (!id) return;
    setMaintenanceError(null);
    try {
      await deleteMaintenanceLog(id, logId);
      setMaintenanceLogs((prev) => prev.filter((l) => l.id !== logId));
    } catch {
      setMaintenanceError('Failed to delete maintenance entry. Please try again.');
    }
  }

  async function handleDeleteRideConfirm(): Promise<void> {
    if (!id || !deleteRideId) return;
    setIsDeletingRide(true);
    setRidesError(null);
    const previousRides = rides;
    setRides((prev) => prev.filter((r) => r.id !== deleteRideId));
    try {
      await deleteRide(id, deleteRideId);
      setDeleteRideId(null);
      const updatedStats = await fetchRideStats(id).catch(() => null);
      setRideStats(updatedStats);
    } catch {
      setRides(previousRides);
      setRidesError('Failed to delete ride. Please try again.');
      setDeleteRideId(null);
    } finally {
      setIsDeletingRide(false);
    }
  }

  const isOwner = Boolean(user && bike && user.id === bike.user_id);

  async function handleHeroChange(url: string): Promise<void> {
    if (!id) return;
    try {
      const updated = await apiClient<BikeItem>(`/bikes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ hero_image_url: url }),
      });
      setBike(updated);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : 'Could not save the photo. Please try again.';
      toast.error(message);
    }
  }

  async function handleDeleteBikeConfirm(): Promise<void> {
    if (!id) return;
    setIsDeletingBike(true);
    try {
      await deleteBike(id);
      void navigate('/me/bikes');
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

  function handleMaintenanceSaved(entry: MaintenanceLogItem): void {
    if (maintenanceDrawer.open && maintenanceDrawer.logId !== undefined) {
      // Edit: replace in-place
      setMaintenanceLogs((prev) => prev.map((l) => (l.id === entry.id ? entry : l)));
    } else {
      // Create: prepend
      setMaintenanceLogs((prev) => [entry, ...prev]);
    }
  }

  function handleRideSaved(entry: RideItem): void {
    if (rideDrawer.open && rideDrawer.rideId !== undefined) {
      // Edit: replace in-place
      setRides((prev) => prev.map((r) => (r.id === entry.id ? entry : r)));
    } else {
      // Create: prepend
      setRides((prev) => [entry, ...prev]);
    }
    // Refresh stats after a ride change
    if (id) {
      fetchRideStats(id)
        .then(setRideStats)
        .catch(() => undefined);
    }
  }

  if (isLoading) {
    return (
      <main id="main" className="bike-detail bikes-page">
        <div className="bike-detail__skeleton">
          <Skeleton width="100%" height="2rem" />
          <Skeleton width="100%" height="18rem" />
          <Skeleton width="100%" height="12rem" />
        </div>
      </main>
    );
  }

  if (isNotFound) {
    return (
      <main id="main" className="bikes-page">
        <h1 className="bikes-page__heading">Bike Not Found</h1>
        <p>The bike you are looking for does not exist or is not available.</p>
        <Link to="/me/bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (loadError !== null) {
    return (
      <main id="main" className="bikes-page">
        <p className="bikes-page__error" role="alert">{loadError}</p>
        <Link to="/me/bikes">Back to My Bikes</Link>
      </main>
    );
  }

  if (!bike) return <></>;

  const deleteComponentTarget = components.find((c) => c.id === deleteComponentId);

  const quickStats = [
    { label: 'Total distance', value: formatKm(Number(bike.total_mileage_km)) },
    { label: 'Total rides', value: rideStats?.ride_count ?? 0 },
    { label: 'Last ride', value: formatRelative(rides[0]?.date) },
    { label: 'Active reminders', value: reminders.filter(r => r.status === 'overdue' || r.status === 'due_soon').length },
  ];

  return (
    <main id="main" className="bike-detail bikes-page">
      <PageHeader
        eyebrow={bike.type}
        title={bike.name}
        subtitle={`${bike.brand} · ${bike.year}`}
        variant="workshop"
        actions={
          isOwner ? (
            <>
              <Link to={`/me/bikes/${bike.id}/edit`} className="btn btn-ghost">Edit</Link>
              <button
                type="button"
                className="btn btn-ghost btn-danger"
                onClick={() => setDeleteBikeOpen(true)}
              >
                Delete
              </button>
            </>
          ) : undefined
        }
      />

      <PhotoGallery
        heroImageUrl={bike.hero_image_url}
        isOwner={isOwner}
        bikeName={bike.name}
        onHeroChange={(url) => void handleHeroChange(url)}
      />

      <div className="bike-detail__layout">
        <div className="bike-detail__main">

          <section aria-labelledby="bike-specs">
            <h2 id="bike-specs" className="section-heading">Specifications</h2>
            {componentError !== null && (
              <p className="bikes-page__error" role="alert">{componentError}</p>
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
            {isOwner && formMode.type === 'closed' && (
              <div className="bike-detail__section-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setFormMode({ type: 'add' })}
                >
                  <PlusIcon /> Add component
                </button>
              </div>
            )}
            <ComponentList
              components={components}
              isOwner={isOwner}
              bikeMileageKm={Number(bike.total_mileage_km)}
              numbered
              onEdit={(component) => {
                setFormMode({ type: 'edit', component });
                setComponentError(null);
              }}
              onDelete={(componentId) => setDeleteComponentId(componentId)}
            />
          </section>

          <section aria-labelledby="bike-maintenance">
            <header className="bike-detail__section-head">
              <h2 id="bike-maintenance" className="section-heading">Maintenance</h2>
              {isOwner && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Log maintenance entry"
                  onClick={() => setMaintenanceDrawer({ open: true })}
                >
                  <PlusIcon /> Log entry
                </button>
              )}
            </header>
            {maintenanceError !== null && (
              <p className="bikes-page__error" role="alert">{maintenanceError}</p>
            )}
            <MaintenanceTimeline
              logs={maintenanceLogs}
              bikeId={id ?? ''}
              isOwner={isOwner}
              onDelete={(logId) => void handleDeleteLog(logId)}
              onEditRequest={(log) =>
                setMaintenanceDrawer({ open: true, logId: log.id, initialData: log })
              }
            />
          </section>

          <section aria-labelledby="bike-rides">
            <header className="bike-detail__section-head">
              <h2 id="bike-rides" className="section-heading">Rides</h2>
              {isOwner && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  aria-label="Log a new ride"
                  onClick={() => setRideDrawer({ open: true })}
                >
                  <PlusIcon /> Log ride
                </button>
              )}
            </header>
            {ridesError !== null && (
              <p className="bikes-page__error" role="alert">{ridesError}</p>
            )}
            {rideStats !== null && <RideStats stats={rideStats} rides={rides} />}
            <RideList
              rides={rides}
              bikeId={id ?? ''}
              isOwner={isOwner}
              onDeleteRequest={(rideId) => setDeleteRideId(rideId)}
              onEditRequest={
                isOwner
                  ? (ride) => setRideDrawer({ open: true, rideId: ride.id, initialData: ride })
                  : undefined
              }
            />
          </section>

        </div>

        <aside className="bike-detail__sidebar" aria-label="Quick stats">
          <StatStrip stats={quickStats} orientation="vertical" />
          {remindersError !== null && (
            <p className="bikes-page__error" role="alert">{remindersError}</p>
          )}
          <ReminderList reminders={reminders} compact />
        </aside>
      </div>

      {/* Maintenance drawer */}
      <MaintenanceFormDrawer
        bikeId={id ?? ''}
        logId={maintenanceDrawer.open ? maintenanceDrawer.logId : undefined}
        initialData={maintenanceDrawer.open ? maintenanceDrawer.initialData : undefined}
        components={components}
        open={maintenanceDrawer.open}
        onClose={() => setMaintenanceDrawer({ open: false })}
        onSaved={handleMaintenanceSaved}
      />

      {/* Ride drawer */}
      <RideFormDrawer
        bikeId={id ?? ''}
        rideId={rideDrawer.open ? rideDrawer.rideId : undefined}
        initialData={rideDrawer.open ? rideDrawer.initialData : undefined}
        open={rideDrawer.open}
        onClose={() => setRideDrawer({ open: false })}
        onSaved={handleRideSaved}
      />

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

      <ConfirmDialog
        isOpen={deleteRideId !== null}
        title="Delete Ride"
        message="Are you sure you want to delete this ride? This action cannot be undone."
        confirmLabel={isDeletingRide ? 'Deleting...' : 'Delete'}
        onConfirm={() => void handleDeleteRideConfirm()}
        onCancel={() => setDeleteRideId(null)}
      />
    </main>
  );
}
