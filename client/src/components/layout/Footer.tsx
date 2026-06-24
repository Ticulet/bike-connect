import { Link } from 'react-router';
import { BrandMark } from './BrandMark.js';
import './footer.css';

export function Footer(): React.JSX.Element {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <Link to="/" className="site-footer__brand" aria-label="Bike Connect home">
          <BrandMark />
          <span>Bike Connect</span>
        </Link>

        <nav className="site-footer__nav" aria-label="Secondary">
          <Link to="/about">About</Link>
          <Link to="/privacy">Privacy</Link>
          <a
            href="https://github.com/nicolasbratu/bike-connect"
            rel="noopener noreferrer"
            target="_blank"
          >
            GitHub
          </a>
        </nav>

        <p className="site-footer__copy">
          &copy; {year} Bike Connect: A field guide for cyclists.
        </p>
      </div>
    </footer>
  );
}
