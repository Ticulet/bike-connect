import { Drawer } from '../../../components/ui/Drawer.js';
import { useToast } from '../../../components/ui/useToast.js';
import { MaintenanceForm } from './MaintenanceForm.js';
import type { MaintenanceLogItem } from '../api/maintenance.api.js';
import type { ComponentItem } from '../../bikes/api/components.api.js';

interface MaintenanceFormDrawerProps {
  bikeId: string;
  /** When provided, the drawer operates in edit mode. */
  logId?: string;
  components?: ComponentItem[];
  initialData?: MaintenanceLogItem;
  open: boolean;
  onClose: () => void;
  /** Called after a successful create or edit so the parent can refresh its list. */
  onSaved?: (entry: MaintenanceLogItem) => void;
}

export function MaintenanceFormDrawer({
  bikeId,
  logId,
  components,
  initialData,
  open,
  onClose,
  onSaved,
}: MaintenanceFormDrawerProps): React.JSX.Element {
  const toast = useToast();

  function handleSuccess(entry: MaintenanceLogItem): void {
    const action = logId !== undefined ? 'updated' : 'logged';
    toast.success(`Maintenance entry ${action}.`);
    onSaved?.(entry);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={logId !== undefined ? 'Edit maintenance entry' : 'Log maintenance'}
      subtitle="Track services, parts, and reminders."
      width="md"
    >
      <MaintenanceForm
        key={logId ?? 'new'}
        bikeId={bikeId}
        logId={logId}
        components={components}
        initialData={initialData}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Drawer>
  );
}
