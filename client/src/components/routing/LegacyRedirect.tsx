import { Navigate, useLocation, useParams } from 'react-router';

interface Props {
  from: string;
  to: string;
}

/**
 * Redirect from a legacy path to a new path, preserving:
 * - URL params (`/my-bikes/123` → `/me/bikes/123`)
 * - query string (`?page=2`)
 * - hash (`#section`)
 */
export function LegacyRedirect({ from: _from, to }: Props): React.JSX.Element {
  const params = useParams();
  const { search, hash } = useLocation();

  // Replace :param tokens in `to` with actual values.
  let resolved = to;
  for (const [key, value] of Object.entries(params)) {
    if (key !== '*' && typeof value === 'string') {
      resolved = resolved.replaceAll(`:${key}`, value);
    }
  }

  // Append the unmatched suffix when wildcard-matching.
  // (Used by /my-bikes/* and /my-posts/*.)
  const wildcard = params['*'];
  if (wildcard != null && wildcard.length > 0) {
    resolved = `${resolved}/${wildcard}`;
  }

  return <Navigate to={`${resolved}${search}${hash}`} replace />;
}
