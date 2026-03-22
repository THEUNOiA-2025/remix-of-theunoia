import { Link } from 'react-router-dom';

const ContactHero = () => {
  return (
    <div className="wrapper">
      <section className="contact-hero">
        {/* Left Content */}
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

        {/* Right Content */}
        <div className="hero-right">
          <img
            className="hero-image"
            src="/images/wolf.jpg"
            alt="Person working on laptop"
          />
        </div>
      </section>
    </div>
  );
};

export default ContactHero;
