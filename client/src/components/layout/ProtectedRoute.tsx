import { Outlet } from 'react-router';

/**
 * Auth guard placeholder — renders children without restriction.
 * Authentication check will be added in TASK-008.
 */
export function ProtectedRoute(): React.JSX.Element {
  return <Outlet />;
}
