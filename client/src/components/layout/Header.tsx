import { NavLink } from 'react-router';

export function Header(): React.JSX.Element {
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
        </nav>
      </div>
    </header>
  );
}
