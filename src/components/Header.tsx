import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();
  
  const navLinks = [
    { path: '/how-it-works', label: 'How It Works' },
    { path: '/features', label: 'Features' },
    { path: '/blog', label: 'Blog' },
    { path: '/faq', label: 'FAQ' },
    { path: '/contact', label: 'Contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white self-stretch w-full text-[15px] max-md:max-w-full">
      <div className="bg-white flex w-full items-stretch gap-5 flex-wrap justify-between px-20 py-6 max-md:max-w-full max-md:px-5">
        <nav className="flex items-stretch gap-12 text-foreground font-medium flex-wrap my-auto max-md:max-w-full">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/images/theunoia-logo.png"
              alt="THEUNOiA Logo"
              className="h-14 object-contain object-left"
            />
          </Link>
          <div className="flex items-stretch gap-8 my-auto">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors hover:text-primary ${
                  isActive(link.path) ? 'text-primary font-bold' : ''
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex items-stretch gap-4 font-bold text-center">
          <Link to="/login">
            <button className="border border-foreground flex items-center justify-center text-foreground px-12 py-4 rounded-full hover:bg-secondary transition-colors max-md:px-6">
              LogIn
            </button>
          </Link>
          <Link to="/signup">
            <button className="bg-primary flex items-center justify-center text-primary-foreground px-12 py-4 rounded-full hover:opacity-90 transition-opacity max-md:px-6">
              SignUp
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
