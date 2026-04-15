export function Footer(): React.JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <p>&copy; {currentYear} Bike Connect. All rights reserved.</p>
      </div>
    </footer>
  );
}
