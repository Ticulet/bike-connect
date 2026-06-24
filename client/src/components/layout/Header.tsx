import { NavLink } from 'react-router';
import { useAuth } from '../../features/auth/hooks/useAuth.js';
import { BrandMark } from './BrandMark.js';
import { ThemeToggle } from './ThemeToggle.js';
import './header.css';

export function Header(): React.JSX.Element {
  const { isAuthenticated, user } = useAuth();

  return (
    <header className="site-header" role="banner">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="site-header__inner">
        <NavLink
          to="/"
          className="site-header__brand"
          aria-label="Bike Connect home"
        >
          <BrandMark />
          <span className="site-header__brand-name">Bike Connect</span>
        </NavLink>

        <nav className="site-header__nav" aria-label="Primary">
          <NavLink
            to="/posts"
            className={({ isActive }) =>
              isActive ? 'site-header__nav-link active' : 'site-header__nav-link'
            }
          >
            Read
          </NavLink>
          <NavLink
            to="/explore/bikes"
            className={({ isActive }) =>
              isActive
                ? 'site-header__nav-link active'
                : 'site-header__nav-link'
            }
          >
            Explore
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/feed"
              className={({ isActive }) =>
                isActive
                  ? 'site-header__nav-link active'
                  : 'site-header__nav-link'
              }
            >
              Feed
            </NavLink>
          )}
        </nav>

        <div className="site-header__account">
          <ThemeToggle />
          {isAuthenticated && user != null ? (
            <NavLink
              to="/me"
              className={({ isActive }) =>
                isActive ? 'site-header__you active' : 'site-header__you'
              }
              aria-label={`Your hub, signed in as ${user.display_name}`}
            >
              {user.avatar_url != null ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="site-header__you-avatar"
                />
              ) : (
                <span
                  className="site-header__you-avatar-fallback"
                  aria-hidden="true"
                >
                  {user.display_name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="site-header__you-name">{user.display_name}</span>
            </NavLink>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                isActive
                  ? 'btn btn-primary site-header__sign-in active'
                  : 'btn btn-primary site-header__sign-in'
              }
            >
              Sign in
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
