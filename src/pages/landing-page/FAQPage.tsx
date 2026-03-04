import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import './styles.css';

// FAQ Data organized by groups
const faqData = [
  {
    group: 'General',
    items: [
      {
        question: 'What is THEUNOiA?',
        answer:
          'THEUNOiA is an innovative skill-development and learning platform designed to help students and young professionals master in-demand skills through structured micro-learning and practical exposure.',
      },
      {
        question: 'Who can use THEUNOiA?',
        answer:
          'THEUNOiA is built for students, beginners, and aspiring professionals who want to develop technical, creative, and soft skills.',
      },
      {
        question: 'What kind of skills are available?',
        answer:
          'Skills include technology, AI, programming, communication, creativity, and career-oriented learning paths.',
      },
      {
        question: 'How does THEUNOiA help in career growth?',
        answer:
          'Through structured learning paths, short engaging videos, and practical skill-based knowledge designed for industry readiness.',
      },
      {
        question: 'Is THEUNOiA beginner-friendly?',
        answer:
          'Yes. The platform uses step-by-step explanations and simple language, making it ideal for beginners.',
      },
      {
        question: 'Can I track my progress?',
        answer:
          'Yes, users can monitor their learning progress and skill development journey directly on the platform.',
      },
    ],
  },
  {
    group: 'For Clients',
    items: [
      {
        question: 'How do I post a project?',
        answer:
          'You can post a project by creating an account, describing your project requirements, and publishing it to receive proposals.',
      },
      {
        question: 'How do I choose the right freelancer?',
        answer:
          'Review portfolios, proposals, and skill relevance to select the best-fit freelancer for your project.',
      },
      {
        question: "What if I'm not satisfied with the work?",
        answer:
          'You can communicate revisions with the freelancer or reach out to support for resolution assistance.',
      },
      {
        question: 'How does payment work?',
        answer:
          'Payments are handled securely through the platform and released once agreed milestones are completed.',
      },
    ],
  },
  {
    group: 'For Freelancers',
    items: [
      {
        question: 'How do I get verified as a student?',
        answer:
          'Verification is done through academic credentials and profile review to ensure authenticity.',
      },
      {
        question: 'How do I get my first project?',
        answer:
          'Complete your profile, showcase skills, and start applying to projects that match your expertise.',
      },
      {
        question: 'What skills are in demand?',
        answer:
          'High-demand skills include development, AI tools, design, content, marketing, and communication.',
      },
      {
        question: 'How do I get paid?',
        answer:
          'Payments are transferred securely to your account after project completion.',
      },
    ],
  },
  {
    group: 'Account & Security',
    items: [
      {
        question: 'How is my data protected?',
        answer:
          'THEUNOiA uses secure infrastructure and best practices to ensure your data remains protected.',
      },
      {
        question: 'Can I delete my account?',
        answer:
          'Yes, account deletion can be requested through account settings or support.',
      },
      {
        question: 'What if I forget my password?',
        answer:
          'You can reset your password securely using the "Forgot Password" option.',
      },
    ],
  },
];

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

// FAQ Item Component
const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details className="faq-item" open={isOpen} onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}>
      <summary>{question}</summary>
      <p>{answer}</p>
    </details>
  );
};

const FAQPage = () => {
  const [isCreationsOpen, setIsCreationsOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

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

  const handleCreationsHover = (isHovering: boolean) => {
    setIsCreationsOpen(isHovering);
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Newsletter signup:', email);
    setEmail('');
  };

  return (
    <div className="landing-page">
      <Helmet>
        <title>earn money online for students | TheUnoia Answers</title>
        <meta name="description" content="Get answers to common questions about online jobs for students, part-time online work, how to earn money online for students, and more with TheUnoia FAQs." />
        <link rel="canonical" href="https://www.theunoia.com/faq" />
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
          <Link to="/faq" className="active">FAQ</Link>
          <Link to="/contact">Contact</Link>
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

      {/* FAQ HERO SECTION */}
      <section className="faq-hero">
        <div className="faq-accent faq-accent-left"></div>
        <div className="faq-accent faq-accent-right"></div>

        <div className="faq-container">
          <span className="blog-chip">FAQ's</span>
          <h1 className="faq-title">Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Everything you need to know about THEUNOiA and how it helps you grow.
          </p>

          <div className="faq-list">
            {faqData.map((group, groupIndex) => (
              <div className="faq-group" key={groupIndex}>
                <div className="faq-group-title">{group.group}</div>
                {group.items.map((item, itemIndex) => (
                  <FAQItem
                    key={itemIndex}
                    question={item.question}
                    answer={item.answer}
                  />
                ))}
              </div>
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
                Our support team is here to help. Reach out and we'll get back to
                you as soon as possible.
              </span>
            </div>

            <div className="cta-group">
              <Link to="/contact" className="cta-link">
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
              </Link>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

export default FAQPage;
