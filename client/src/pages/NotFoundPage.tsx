import { Link } from 'react-router';
import './not-found.css';

/* ------------------------------------------------------------------ */
/* Inline SVG icons                                                     */
/* ------------------------------------------------------------------ */

function ArrowIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3 9h12M10 5l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BookIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="2" width="12" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <line x1="6" y1="6" x2="12" y2="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="6" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CompassIcon(): React.JSX.Element {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M11.5 6.5L10 10L6.5 11.5L8 8L11.5 6.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteMapBackground(): React.JSX.Element {
  return (
    <svg
      className="not-found__bg"
      viewBox="0 0 800 600"
      aria-hidden="true"
      focusable="false"
    >
      {/* Topo contour lines */}
      <path d="M0 200 Q 200 150 400 200 T 800 200" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M0 280 Q 200 230 400 280 T 800 280" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M0 360 Q 200 310 400 360 T 800 360" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M0 440 Q 200 390 400 440 T 800 440" stroke="currentColor" strokeWidth="1" fill="none" />
      {/* Winding route */}
      <path
        d="M50 500 Q 200 400 350 450 T 600 350 Q 700 300 750 200"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
        fill="none"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Page component                                                       */
/* ------------------------------------------------------------------ */

export function NotFoundPage(): React.JSX.Element {
  return (
    <main className="not-found" id="main">
      <div className="not-found__inner">
        <p className="not-found__eyebrow">Off the trail</p>
        <h1 className="not-found__title display-cover">404</h1>
        <p className="not-found__lead">
          That page seems to have ridden off without us.{' '}
          Here are a few good places to head next.
        </p>
        <nav className="not-found__suggestions" aria-label="Suggested pages">
          <Link to="/" className="not-found__suggestion">
            <ArrowIcon />
            Home
          </Link>
          <Link to="/posts" className="not-found__suggestion">
            <BookIcon />
            Read the journal
          </Link>
          <Link to="/explore/bikes" className="not-found__suggestion">
            <CompassIcon />
            Explore bikes
          </Link>
        </nav>
      </div>
      <RouteMapBackground />
    </main>
  );
}
