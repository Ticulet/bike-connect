import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import './toast.css';

// ---------- Types ----------

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastInput {
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms; 0 = sticky
  action?: { label: string; onClick: () => void };
}

export interface ToastApi {
  show: (input: ToastInput) => void;
  success: (
    message: string,
    opts?: Omit<ToastInput, 'message' | 'variant'>,
  ) => void;
  error: (
    message: string,
    opts?: Omit<ToastInput, 'message' | 'variant'>,
  ) => void;
  info: (
    message: string,
    opts?: Omit<ToastInput, 'message' | 'variant'>,
  ) => void;
}

interface ToastEntry extends Required<Omit<ToastInput, 'action'>> {
  id: string;
  action?: ToastInput['action'];
  state: 'visible' | 'dismissed';
}

// ---------- Context ----------

export const ToastContext = createContext<ToastApi | null>(null);

// ---------- Icons ----------

function SuccessIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="toast__icon">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.5 10l2.5 2.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="toast__icon">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 6v4M10 13.5v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InfoIcon(): React.JSX.Element {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="toast__icon">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10 9v5M10 6.5v.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DismissIcon(): React.JSX.Element {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M4 4L12 12M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------- Toast item ----------

interface ToastItemProps {
  toast: ToastEntry;
  onDismiss: (id: string) => void;
}

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onDismiss }: ToastItemProps): React.JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef<number>(toast.duration);
  const startedAtRef = useRef<number>(0);
  const isPausedRef = useRef<boolean>(false);

  const startTimer = useCallback((): void => {
    if (toast.duration === 0) return; // sticky
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, remainingRef.current);
    startedAtRef.current = Date.now();
    isPausedRef.current = false;
  }, [toast.duration, toast.id, onDismiss]);

  const pauseTimer = useCallback((): void => {
    if (toast.duration === 0 || isPausedRef.current) return;
    if (timerRef.current != null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    remainingRef.current -= Date.now() - startedAtRef.current;
    isPausedRef.current = true;
  }, [toast.duration]);

  useEffect(() => {
    startTimer();
    return () => {
      if (timerRef.current != null) clearTimeout(timerRef.current);
    };
  }, [startTimer]);

  const icon =
    toast.variant === 'success' ? (
      <SuccessIcon />
    ) : toast.variant === 'error' ? (
      <ErrorIcon />
    ) : (
      <InfoIcon />
    );

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : undefined}
      className="toast"
      data-variant={toast.variant}
      data-state={toast.state}
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      onFocus={pauseTimer}
      onBlur={startTimer}
    >
      {icon}
      <div className="toast__content">
        <p className="toast__message">{toast.message}</p>
        {toast.action != null && (
          <button
            type="button"
            className="toast__action"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        className="toast__dismiss"
        onClick={() => { onDismiss(toast.id); }}
        aria-label="Dismiss notification"
      >
        <DismissIcon />
      </button>
    </div>
  );
}

// ---------- Provider ----------

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps): React.JSX.Element {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counterRef = useRef<number>(0);

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((input: ToastInput): void => {
    const id = `toast-${++counterRef.current}`;
    const entry: ToastEntry = {
      id,
      message: input.message,
      variant: input.variant ?? 'info',
      duration: input.duration ?? DEFAULT_DURATION,
      action: input.action,
      state: 'visible',
    };
    setToasts((prev) => {
      // Cap at MAX_VISIBLE — new toast replaces oldest when over limit.
      const next = [...prev, entry];
      return next.length > MAX_VISIBLE ? next.slice(next.length - MAX_VISIBLE) : next;
    });
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (message, opts) => { show({ ...opts, message, variant: 'success' }); },
      error: (message, opts) => { show({ ...opts, message, variant: 'error' }); },
      info: (message, opts) => { show({ ...opts, message, variant: 'info' }); },
    }),
    [show],
  );

  // Polite region for success/info; assertive for errors (rendered inline via role="alert").
  const politeToasts = toasts.filter((t) => t.variant !== 'error');
  const assertiveToasts = toasts.filter((t) => t.variant === 'error');

  const regions = (
    <>
      {/* Polite region */}
      <output
        role="status"
        aria-live="polite"
        aria-atomic="false"
        className="toast-region"
      >
        {politeToasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </output>

      {/* Assertive region for errors — offset above the polite stack via a CSS-driven count */}
      {assertiveToasts.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          aria-atomic="false"
          className="toast-region toast-region--assertive"
          style={{ '--toast-stack-offset': politeToasts.length } as React.CSSProperties}
        >
          {assertiveToasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(regions, document.body)}
    </ToastContext.Provider>
  );
}
