import { Link } from 'react-router';

export function NotFoundPage(): React.JSX.Element {
  return (
    <article>
      <h1>404 — Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link to="/">Return to Home</Link>
    </article>
  );
}
