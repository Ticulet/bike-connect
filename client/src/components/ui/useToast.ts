import { useContext } from 'react';
import { ToastContext } from './ToastProvider.js';
import type { ToastApi } from './ToastProvider.js';

/**
 * Returns the toast API for firing success/error/info notifications.
 * Must be used inside a <ToastProvider>.
 */
export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (context == null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
