import { NavLink } from 'react-router';
import { useAuth } from '../../features/auth/hooks/useAuth.js';

export function Header(): React.JSX.Element {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="site-header" role="banner">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="site-header__inner">
        <NavLink to="/" className="site-header__logo" aria-label="Bike Connect — Home">
          Bike Connect
        </NavLink>
        <nav className="site-nav" aria-label="Main navigation">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/my-posts"
                className={({ isActive }) =>
                  isActive ? 'site-nav__link active' : 'site-nav__link'
                }
              >
                My Posts
              </NavLink>
              <NavLink
                to="/my-bikes"
                className={({ isActive }) =>
                  isActive ? 'site-nav__link active' : 'site-nav__link'
                }
              >
                My Bikes
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? 'site-nav__link active' : 'site-nav__link'
                }
              >
                Dashboard
              </NavLink>
              <span className="site-nav__user" aria-label={`Signed in as ${user?.display_name}`}>
                {user?.display_name}
              </span>
              <button
                type="button"
                className="site-nav__logout"
                onClick={() => void logout()}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/posts"
                className={({ isActive }) =>
                  isActive ? 'site-nav__link active' : 'site-nav__link'
                }
              >
                Posts
              </NavLink>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  isActive ? 'site-nav__link active' : 'site-nav__link'
                }
              >
                Login
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
