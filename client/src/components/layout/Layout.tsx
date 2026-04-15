import { Outlet } from 'react-router';
import { Footer } from './Footer.js';
import { Header } from './Header.js';

export function Layout(): React.JSX.Element {
  return (
    <div className="app-layout">
      <Header />
      <main id="main" className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
