import { Target } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const socialLinks = [
  { name: 'Facebook', className: 'facebook', url: '#' },
  { name: 'LinkedIn', className: 'linkedin', url: 'https://www.linkedin.com/company/theunoia/' },
  { name: 'X', className: 'x', url: '#' },
  { name: 'YouTube', className: 'youtube', url: '#' },
  { name: 'Instagram', className: 'instagram', url: 'https://www.instagram.com/theunoia_?igsh=Y2xjcG41ZTNic2Vw&utm_source=qr' },
];

const quickLinks = [
  { name: 'HOME', url: '/' },
  { name: 'BLOG', url: '/blog' },
  { name: "FAQ's", url: '/faq' },
  { name: 'CONTACT', url: '/contact' },
  { name: 'SUPPORT', url: 'https://helpmenow-theunoia.com/' },
];

const legalLinks = [
  { name: 'Terms & Conditions', url: '#' },
  { name: 'Privacy & Policy', url: '#' },
];

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <footer className="poster-footer">
      {/* TOP NAV AREA */}
      <div className="footer-top">
        <div className="footer-socials">
          <h4>CONNECT</h4>
          <ul className="social-icons">
            {socialLinks.map((social) => (
              <li key={social.name} className={social.className}>
                <a target='_blank' rel="noopener noreferrer" href={social.url}>{social.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-nav">
          <h4>QUICK LINKS</h4>
          <ul>
            {quickLinks.map((link) => (
              <li key={link.name}>
                <Link to={link.url}>{link.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-creations">
          <h4>LEGAL</h4>
          <ul>
            {legalLinks.map((link) => (
              <li key={link.name}>
                <a href={link.url}>{link.name}</a>
              </li>
            ))}
          </ul>
        </div>

        <div className="footer-newsletter">
          <span>SIGN UP TO OUR NEWSLETTER</span>
          <form onSubmit={handleNewsletterSubmit}>
            <div className="newsletter-input">
              <input
                type="email"
                placeholder="YOUR EMAIL"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit">↗</button>
            </div>
          </form>
        </div>
      </div>

      {/* MASSIVE CENTER TEXT */}
      <div className="footer-title theunoia-3d">THEUNOIA</div>

      {/* BOTTOM META */}
      <div className="footer-bottom">
        <span>© 2026 THEUNOIA / ALL RIGHTS RESERVED</span>

        <span className="footer-links">
          A Platform where Skills Create Opportunity
        </span>

        <span className="footer-social">MADE FOR INDIA</span>
      </div>
    </footer>
  );
};

export default Footer;
