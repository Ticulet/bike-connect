import { useState } from 'react';
import { MaintenanceEntry } from './MaintenanceEntry.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import type { MaintenanceLogItem } from '../api/maintenance.api.js';

interface MaintenanceTimelineProps {
  logs: MaintenanceLogItem[];
  bikeId: string;
  isOwner: boolean;
  onDelete: (logId: string) => void;
  /** When provided, called with the log entry to edit (for drawer invocation). */
  onEditRequest?: (log: MaintenanceLogItem) => void;
}

export function MaintenanceTimeline({
  logs,
  bikeId: _bikeId,
  isOwner,
  onDelete,
  onEditRequest,
}: MaintenanceTimelineProps): React.JSX.Element {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const deleteTarget = logs.find((log) => log.id === deleteTargetId);

  function handleDeleteRequest(logId: string): void {
    setDeleteTargetId(logId);
  }

  function handleDeleteConfirm(): void {
    if (deleteTargetId !== null) {
      onDelete(deleteTargetId);
    }
    setDeleteTargetId(null);
  }

  function handleDeleteCancel(): void {
    setDeleteTargetId(null);
  }

  return (
    <>
      <div className="maintenance-timeline">
        {logs.length === 0 ? (
          <p className="maintenance-timeline__empty">No maintenance records yet.</p>
        ) : (
          logs.map((log) => (
            <MaintenanceEntry
              key={log.id}
              log={log}
              isOwner={isOwner}
              onEdit={onEditRequest !== undefined ? () => onEditRequest(log) : undefined}
              onDelete={() => handleDeleteRequest(log.id)}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        title="Delete Maintenance Record"
        message={
          deleteTarget !== undefined
            ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`
            : 'Are you sure you want to delete this maintenance record? This action cannot be undone.'
        }
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
