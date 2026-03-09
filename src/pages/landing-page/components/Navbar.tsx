import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const creationsData = [
  { title: 'VIDEO EDITING' },
  { title: 'PHOTOGRAPHY' },
  { title: 'WEB DEVELOPMENT' },
  { title: 'GRAPHIC DESIGN' },
  { title: 'WRITING WORKS' },
  { title: 'ADMIN & SUPPORT' },
  { title: 'LIFESTYLE / CREATIVE' },
  { title: 'DIGITAL MARKETING' },
];

const Navbar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isCreationsOpen, setIsCreationsOpen] = useState(false);
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to check if a path is active
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle body class for nav-open
  useEffect(() => {
    if (isNavOpen) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
    return () => document.body.classList.remove('nav-open');
  }, [isNavOpen]);

  // Handle body class for aside-open
  useEffect(() => {
    if (isAsideOpen) {
      document.body.classList.add('aside-open');
    } else {
      document.body.classList.remove('aside-open');
    }
    return () => document.body.classList.remove('aside-open');
  }, [isAsideOpen]);

  // Close menu on route change
  useEffect(() => {
    setIsNavOpen(false);
    setIsAsideOpen(false);
    setIsCreationsOpen(false);
  }, [location.pathname]);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
    setIsAsideOpen(false); // Close aside when toggling nav
  };

  // Close mobile menu when a nav link is tapped
  const handleLinkClick = () => {
    if (isMobile) {
      setIsNavOpen(false);
    }
  };

  const handleCreationsClick = (e: React.MouseEvent) => {
    if (isMobile) {
      e.preventDefault();
      setIsAsideOpen(!isAsideOpen);
    }
  };

  const handleCreationsHover = (isHovering: boolean) => {
    if (!isMobile) {
      setIsCreationsOpen(isHovering);
    }
  };

  return (
    <>
      {/* Mobile overlay backdrop — top-level sibling so it is NOT inside the
          header's stacking context (header z-index: 1000). This lets the
          nav-links panel (z-index: 997) render above the overlay (z-index: 996)
          correctly, while both remain below the navbar (z-index: 1000). */}
      <div
        className="nav-overlay"
        aria-hidden="true"
        onClick={() => setIsNavOpen(false)}
      />

      <header className="landing-navbar">
        <div className="landing-logo">
          <Link to="/">
            <img src="/images/theunoia-logo.png" alt="Theunoia" />
          </Link>
        </div>

        <nav className="landing-nav-links">
          <a
            href="creations"
            className={`has-creations ${isCreationsOpen || isAsideOpen ? 'open' : ''}`}
            onClick={handleCreationsClick}
            onMouseEnter={() => handleCreationsHover(true)}
            onMouseLeave={() => handleCreationsHover(false)}
          >
            Our Creations
            <span className="dropdown-icon">▾</span>
          </a>
          <a href="features" onClick={handleLinkClick}>Features</a>
          <Link to="/blog" className={isActive('/blog') ? 'act' : ''} onClick={handleLinkClick}>Blog</Link>
          <Link to="/faq" className={isActive('/faq') ? 'act' : ''} onClick={handleLinkClick}>FAQ</Link>
          <Link to="/contact" className={isActive('/contact') ? 'act' : ''} onClick={handleLinkClick}>Contact</Link>
        </nav>

        <button
          className={`landing-nav-toggle${isNavOpen ? ' is-open' : ''}`}
          aria-label={isNavOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isNavOpen}
          onClick={toggleNav}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className="landing-nav-actions">
          <button
            className="landing-btn landing-login-btn"
            onClick={() => navigate('/login')}
          >
            <span>Login</span>
          </button>
          <button
            className="landing-btn landing-signup-btn"
            onClick={() => navigate('/signup')}
          >
            <span>Sign Up</span>
          </button>
        </div>
      </header>

      {/* Creations Aside Dropdown */}
      <aside
        className={`creations-aside ${isCreationsOpen || isAsideOpen ? 'open' : ''}`}
        onMouseEnter={() => handleCreationsHover(true)}
        onMouseLeave={() => handleCreationsHover(false)}
      >
        <div className="aside-grid">
          {creationsData.map((item, index) => (
            <div className="aside-card" key={index}>
              <h4>{item.title}</h4>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Navbar;
