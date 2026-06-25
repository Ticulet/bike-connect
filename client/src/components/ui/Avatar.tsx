import { useEffect, useState } from 'react';
import { isSafeImageUrl } from '../../lib/safe-url.js';

interface AvatarProps {
  /** Image URL (e.g. a Google avatar). Falls back to the initial when missing,
   *  unsafe, or it fails to load. */
  src: string | null | undefined;
  /** Drives the fallback initial and the accessible alt text. */
  name: string;
  className?: string;
  fallbackClassName?: string;
  /**
   * Decorative (default): alt="" and the fallback is aria-hidden — for when a
   * visible name sits beside the avatar. Set false to expose the name to
   * assistive tech.
   */
  decorative?: boolean;
}

/**
 * Renders a user avatar with a graceful fallback to the person's initial.
 *
 * Google (`googleusercontent`) avatars are throttled or blocked when the browser
 * sends a referrer, and the resulting non-image error response is then aborted
 * (NS_BINDING_ABORTED) or ORB-blocked — leaving a broken image. `referrerPolicy`
 * makes them load reliably, and `onError` covers any remaining failure so the
 * user always sees either their photo or their initial, never a broken image.
 */
export function Avatar({
  src,
  name,
  className,
  fallbackClassName,
  decorative = true,
}: AvatarProps): React.JSX.Element {
  const [failed, setFailed] = useState(false);

  // Retry when the source changes (e.g. the avatar is updated or another user
  // signs in) instead of staying stuck on the previous failure.
  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (isSafeImageUrl(src) && !failed) {
    return (
      <img
        src={src}
        alt={decorative ? '' : `${name}'s avatar`}
        className={className}
        referrerPolicy="no-referrer"
        onError={() => {
          setFailed(true);
        }}
      />
    );
  }

  return (
    <span className={fallbackClassName} aria-hidden={decorative ? true : undefined}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
