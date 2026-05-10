import { NavLink, Outlet } from 'react-router';
import './me-layout.css';

interface SectionItem {
  to: string;
  label: string;
  end?: boolean;
}

const sections: SectionItem[] = [
  { to: '/me', label: 'Hub', end: true },
  { to: '/me/posts', label: 'Posts' },
  { to: '/me/bikes', label: 'Bikes' },
  { to: '/me/bookmarks', label: 'Bookmarks' },
  { to: '/me/settings', label: 'Settings' },
];

export function MeLayout(): React.JSX.Element {
  return (
    <div className="me-layout">
      <a href="#me-main" className="skip-link">
        Skip to hub content
      </a>
      <nav className="me-layout__rail" aria-label="Personal sections">
        <ul className="me-layout__rail-list">
          {sections.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  isActive
                    ? 'me-layout__rail-link is-active'
                    : 'me-layout__rail-link'
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <main id="me-main" className="me-layout__main">
        <Outlet />
      </main>
    </div>
  );
}
