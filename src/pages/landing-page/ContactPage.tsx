import { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import './styles.css';


// Creations data for dropdown
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

// Social links for footer
const socialLinks = [
  { name: 'Facebook', className: 'facebook', url: '#' },
  { name: 'LinkedIn', className: 'linkedin', url: '#' },
  { name: 'X', className: 'x', url: '#' },
  { name: 'YouTube', className: 'youtube', url: '#' },
  { name: 'Instagram', className: 'instagram', url: '#' },
];

const quickLinks = [
  { name: 'HOME', url: '/' },
  { name: 'BLOG', url: '/blog' },
  { name: "FAQ's", url: '/faq' },
  { name: 'CONTACT', url: '/contact' },
  { name: 'SUPPORT', url: '#' },
];

const legalLinks = [
  { name: 'Terms & Conditions', url: '#' },
  { name: 'Privacy & Policy', url: '#' },
];

// Info Card Component with 3D tilt effect
const InfoCard = ({
  icon,
  title,
  info,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  info: string;
  index: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    cardRef.current.style.transform = `translateY(-16px) scale(1.03) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'translateY(0) scale(1)';
  };

  return (
    <div
      ref={cardRef}
      className="info-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ animationDelay: `${0.4 + index * 0.2}s` }}
    >
      <div className="icon-container">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-info" dangerouslySetInnerHTML={{ __html: info }} />
    </div>
  );
};

const ContactPage = () => {
  const [isCreationsOpen, setIsCreationsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const navigate = useNavigate();
  const topMaskRef = useRef<HTMLDivElement>(null);
  const bottomMaskRef = useRef<HTMLDivElement>(null);

  const toggleNav = () => setIsNavOpen((prev) => !prev);

  // Sync body class for CSS nav drawer
  useEffect(() => {
    if (isNavOpen) {
      document.body.classList.add('nav-open');
    } else {
      document.body.classList.remove('nav-open');
    }
    return () => document.body.classList.remove('nav-open');
  }, [isNavOpen]);

  // Contact reveal animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (topMaskRef.current && bottomMaskRef.current) {
        topMaskRef.current.style.transition =
          'transform 8000ms cubic-bezier(0.16, 1, 0.3, 1)';
        bottomMaskRef.current.style.transition =
          'transform 8000ms cubic-bezier(0.16, 1, 0.3, 1)';
        topMaskRef.current.style.transform = 'translateY(-110%)';
        bottomMaskRef.current.style.transform = 'translateY(110%)';
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleCreationsHover = (isHovering: boolean) => {
    setIsCreationsOpen(isHovering);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Handle form submission logic here
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', newsletterEmail);
    setNewsletterEmail('');
  };

  // Info cards data
  const infoCards = [
    {
      title: 'Head Office',
      info: 'M/S THEUNOiA LLP Lakshmi nagar Chandrapur<br>Maharashtra-442401',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      title: 'Email us',
      info: 'Support@theunoia.com',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      ),
    },
    {
      title: 'Call us',
      info: 'Phone: +91 6374214583',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="landing-page">
      <Helmet>
        <title>TheUnoia | Contact – Hire Top Freelance Talent</title>
        <meta name="description" content="Get in touch with TheUnoia team for support, collaboration, or inquiries about online jobs, hiring freelance talent, and platform services." />
        <link rel="canonical" href="https://www.theunoia.com/contact" />
      </Helmet>
      {/* NAVBAR */}
      <header className="landing-navbar">
        <div className="landing-logo">
          <Link to="/">
            <img src="/images/theunoia-logo.png" alt="Theunoia" />
          </Link>
        </div>

        <nav className={`landing-nav-links${isNavOpen ? ' is-open' : ''}`}>
          <a
            href="creations"
            className={`has-creations ${isCreationsOpen ? 'open' : ''}`}
            onMouseEnter={() => handleCreationsHover(true)}
            onMouseLeave={() => handleCreationsHover(false)}
          >
            Our Creations
            <span className="dropdown-icon">▾</span>
          </a>
          <a href="features">Features</a>
          <Link to="/blog">Blog</Link>
          <Link to="/faq">FAQ</Link>
          <Link to="/contact" className="active">
            Contact
          </Link>
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
        className={`creations-aside ${isCreationsOpen ? 'open' : ''}`}
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

      {/* CONTACT REVEAL SECTION */}
      <section className="contact-reveal">
        <div className="text-mask">
          <div className="mask top" ref={topMaskRef}></div>
          <div className="mask bottom" ref={bottomMaskRef}></div>
          <h1>Contact Us</h1>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section className="contact-section">
        <div className="contact-container">
          {/* INTRO OUTSIDE FORM */}
          <div className="form-intro">
            <h2>Let's talk about your idea</h2>
            <p>
              Have a question or a project in mind? Fill out the form and we'll
              get back to you shortly.
            </p>
          </div>

          {/* FORM */}
          <form className="contact-form" onSubmit={handleFormSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>NAME</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="field">
                <label>EMAIL</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="field full">
                <label>SUBJECT</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="What is this regarding?"
                  value={formData.subject}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="field full">
                <label>MESSAGE</label>
                <textarea
                  name="message"
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleFormChange}
                  required
                ></textarea>
              </div>
            </div>

            <button type="submit" className="submit-btn">
              SUBMIT
            </button>
          </form>
        </div>
      </section>

      {/* GET IN TOUCH SECTION */}
      <section className="get-in-touch-section">
        <div className="deco-circle circle-1"></div>
        <div className="deco-circle circle-2"></div>
        <div className="deco-circle circle-3"></div>

        <div className="touch-container">
          <div className="touch-header">
            <span className="label">GET IN TOUCH</span>
            <h2>
              Don't hesitate to contact us for more
              <br />
              information.
            </h2>
            <p>
              We're here to help and answer any questions you might have. Reach
              out to us and we'll respond as soon as we can.
            </p>
          </div>

          <div className="info-cards-grid">
            {infoCards.map((card, index) => (
              <InfoCard
                key={index}
                index={index}
                icon={card.icon}
                title={card.title}
                info={card.info}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT HERO SECTION */}
      <div className="wrapper">
        <section className="contact-hero">
          <div className="hero-left">
            <div className="headline">
              <span className="headline-main">Still have questions?</span>
              <span className="headline-sub">
                Our support team is here to help. Reach out and we'll get back
                to you as soon as possible.
              </span>
            </div>

            <div className="cta-group">
              <a href="#" className="cta-link">
                <span className="cta-text">Get in touch</span>
                <svg
                  className="cta-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="hero-right">
            <img
              className="hero-image"
              src="/images/wolf.jpg"
              alt="Person working on laptop"
            />
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer className="poster-footer">
        <div className="footer-top">
          <div className="footer-socials">
            <h4>CONNECT</h4>
            <ul className="social-icons">
              {socialLinks.map((social) => (
                <li key={social.name} className={social.className}>
                  <a href={social.url}>{social.name}</a>
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
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit">↗</button>
              </div>
            </form>
          </div>
        </div>

        <div className="footer-title theunoia-3d">THEUNOIA</div>

        <div className="footer-bottom">
          <span>© 2026 THEUNOIA / ALL RIGHTS RESERVED</span>
          <span className="footer-links">
            A Platform where Skills Create Opportunity
          </span>
          <span className="footer-social">MADE FOR INDIA</span>
        </div>
      </footer>
    </div>
  );
};

export default ContactPage;
