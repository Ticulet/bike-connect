import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import './drawer.css';

interface DrawerProps {
  /** Whether the drawer is open. Controlled. */
  open: boolean;
  /** Called when the drawer requests to close (ESC, scrim, close button). */
  onClose: () => void;
  /** Drawer title (rendered as h2 and announced to screen readers). */
  title: string;
  /** Optional subtitle line under the title. */
  subtitle?: string;
  /** Drawer body content. */
  children: ReactNode;
  /** Optional footer slot (Save / Cancel buttons). */
  footer?: ReactNode;
  /** Optional. Defaults to "md" (480 px). */
  width?: 'sm' | 'md' | 'lg';
}

/** Inline close (X) icon — no external library. */
function CloseIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'md',
}: DrawerProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const prevBodyOverflow = useRef<string>('');
  const titleId = useId();
  const subtitleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog == null) return;

    if (open) {
      // Capture trigger before taking focus away.
      triggerRef.current = document.activeElement;

      // Lock body scroll.
      prevBodyOverflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Use native showModal() if available (provides focus trap + inert outside).
      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) {
          dialog.showModal();
        }
      }
    } else {
      // Close the dialog.
      if (dialog.open) {
        dialog.close();
      }

      // Restore body scroll.
      document.body.style.overflow = prevBodyOverflow.current;

      // Restore focus to the original trigger.
      const trigger = triggerRef.current;
      if (trigger != null && trigger instanceof HTMLElement) {
        trigger.focus();
      }
      triggerRef.current = null;
    }
  }, [open]);

  // Handle the native ESC cancel event (also fires on dialog.close()).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog == null) return;

    function handleCancel(event: Event): void {
      event.preventDefault();
      onClose();
    }

    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  // Clean up body overflow if the component unmounts while open.
  useEffect(() => {
    return () => {
      if (dialogRef.current?.open === true) {
        document.body.style.overflow = prevBodyOverflow.current;
      }
    };
  }, []);

  return (
    <>
      {/* Scrim */}
      <div
        className="drawer-scrim"
        data-state={open ? 'open' : 'closed'}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <dialog
        ref={dialogRef}
        className="drawer"
        data-width={width}
        data-state={open ? 'open' : 'closed'}
        aria-labelledby={titleId}
        aria-describedby={subtitle != null ? subtitleId : undefined}
      >
        <header className="drawer__header">
          <div className="drawer__title-block">
            <h2 id={titleId} className="drawer__title">
              {title}
            </h2>
            {subtitle != null && (
              <p id={subtitleId} className="drawer__subtitle">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close drawer"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="drawer__body">{children}</div>

        {footer != null && (
          <footer className="drawer__footer">{footer}</footer>
        )}
      </dialog>
    </>
  );
}
