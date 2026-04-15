import { Link } from 'react-router';

export function HomePage(): React.JSX.Element {
  return (
    <article>
      <h1>Welcome to Bike Connect</h1>
      <p>Your bicycle blog and bike management platform.</p>
      <nav aria-label="Quick links">
        <ul>
          <li>
            <Link to="/posts">Browse Posts</Link>
          </li>
          <li>
            <Link to="/login">Sign In</Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}
