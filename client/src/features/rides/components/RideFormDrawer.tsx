import { Drawer } from '../../../components/ui/Drawer.js';
import { useToast } from '../../../components/ui/useToast.js';
import { RideForm } from './RideForm.js';
import type { RideItem } from '../api/rides.api.js';

interface RideFormDrawerProps {
  bikeId: string;
  /** When provided, the drawer operates in edit mode. */
  rideId?: string;
  initialData?: RideItem;
  open: boolean;
  onClose: () => void;
  /** Called after a successful create or edit so the parent can refresh its list. */
  onSaved?: (entry: RideItem) => void;
}

export function RideFormDrawer({
  bikeId,
  rideId,
  initialData,
  open,
  onClose,
  onSaved,
}: RideFormDrawerProps): React.JSX.Element {
  const toast = useToast();

  function handleSuccess(entry: RideItem): void {
    const action = rideId !== undefined ? 'updated' : 'logged';
    toast.success(`Ride ${action}.`);
    onSaved?.(entry);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={rideId !== undefined ? 'Edit ride' : 'Log a ride'}
      subtitle="Record your distance, duration, and notes."
      width="sm"
    >
      <RideForm
        key={rideId ?? 'new'}
        bikeId={bikeId}
        rideId={rideId}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Drawer>
  );
}
