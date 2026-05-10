import { useState } from 'react';
import { MaintenanceEntry } from './MaintenanceEntry.js';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { EmptyState } from '../../../components/ui/EmptyState.js';
import type { MaintenanceLogItem } from '../api/maintenance.api.js';

function WrenchIcon(): React.JSX.Element {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
          <EmptyState
            icon={<WrenchIcon />}
            title="No maintenance records yet"
            description={
              isOwner
                ? 'Log your first service to start tracking bike health.'
                : 'No maintenance has been logged for this bike.'
            }
          />
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
