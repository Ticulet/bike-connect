import { Outlet } from 'react-router';
import { Footer } from './Footer.js';
import { Header } from './Header.js';
import { MobileTabBar } from './MobileTabBar.js';

export function Layout(): React.JSX.Element {
  return (
    <div className="app-layout">
      <Header />
      <main id="main" className="main-content">
        <Outlet />
      </main>
      <Footer />
      {/* MobileTabBar is CSS-hidden on desktop (>640px) */}
      <MobileTabBar />
    </div>
  );
}
