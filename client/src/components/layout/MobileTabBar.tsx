import { NavLink } from 'react-router';
import { useAuth } from '../../features/auth/hooks/useAuth.js';
import './mobile-tab-bar.css';

// ---------- Icons (hand-rolled inline SVGs — no icon library, REQ-040) ----------

function BookIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeedIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M4 10h16M4 14h10M4 18h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoginIcon(): React.JSX.Element {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="10 17 15 12 10 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="15"
        y1="12"
        x2="3"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ---------- Component ----------

export function MobileTabBar(): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  return (
    <nav className="mobile-tab-bar" aria-label="Mobile">
      <ul className="mobile-tab-bar__list">
        <li>
          <NavLink
            to="/posts"
            className={({ isActive }) =>
              isActive
                ? 'mobile-tab-bar__item active'
                : 'mobile-tab-bar__item'
            }
          >
            <BookIcon />
            <span className="mobile-tab-bar__label">Read</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/explore/bikes"
            className={({ isActive }) =>
              isActive
                ? 'mobile-tab-bar__item active'
                : 'mobile-tab-bar__item'
            }
          >
            <CompassIcon />
            <span className="mobile-tab-bar__label">Explore</span>
          </NavLink>
        </li>
        {isAuthenticated ? (
          <>
            <li>
              <NavLink
                to="/feed"
                className={({ isActive }) =>
                  isActive
                    ? 'mobile-tab-bar__item active'
                    : 'mobile-tab-bar__item'
                }
              >
                <FeedIcon />
                <span className="mobile-tab-bar__label">Feed</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/me"
                className={({ isActive }) =>
                  isActive
                    ? 'mobile-tab-bar__item active'
                    : 'mobile-tab-bar__item'
                }
              >
                <UserIcon />
                <span className="mobile-tab-bar__label">You</span>
              </NavLink>
            </li>
          </>
        ) : (
          <li>
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? 'mobile-tab-bar__item mobile-tab-bar__item--cta active'
                  : 'mobile-tab-bar__item mobile-tab-bar__item--cta'
              }
            >
              <LoginIcon />
              <span className="mobile-tab-bar__label">Sign in</span>
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  );
}
