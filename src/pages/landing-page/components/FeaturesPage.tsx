import { useEffect, useRef, useCallback, Fragment } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import InteractiveDotGrid from './InteractiveDotGrid';
import './styles.css';

// Marquee items
const marqueeItems = [
  'Smart Onboarding', 'DigiLocker Verified', 'Community Groups',
  'Real-Time Messaging', 'Audio Calls', 'Screen Sharing',
  'Bidding System', 'Collaborative Projects', 'Leaderboard',
  'AI Client Assist', 'Task Tracking', 'Skill Verification',
  'Tech News API', 'Tutorial Hub',
];

// Bento card data
const bentoCards = [
  {
    num: '01', icon: 'login', title: 'Smart Sign-Up & Onboarding',
    desc: 'A streamlined sign-up process for students and clients — quick profile creation, preference setup, and instant access to projects and talent without unnecessary complexity.',
    tag: 'Onboarding', size: 'bento-wide', featured: true, hasVisual: true,
  },
  {
    num: '02', icon: 'verified_user', title: 'DigiLocker Identity Verification',
    desc: 'Secure verification via DigiLocker ensures authentic profiles, builds client trust, and prevents fraudulent activity on the platform.',
    tag: 'Security', size: 'bento-narrow',
  },
  {
    num: '03', icon: 'groups', title: 'College-Based Communities',
    desc: 'Join dedicated college communities, fostering peer learning, collaboration, and trust within a familiar academic environment.',
    tag: 'Community', size: 'bento-narrow',
  },
  {
    num: '04', icon: 'chat', title: 'Real-Time Messaging',
    desc: 'In-platform messaging enables seamless, transparent communication between students and clients throughout the entire project lifecycle — no external tools needed.',
    tag: 'Communication', size: 'bento-wide', featured: true, hasVisual: true,
  },
  {
    num: '05', icon: 'call', title: 'Audio Communication',
    desc: 'Audio-only calls for focused discussions, reviews, and coordination with low bandwidth usage.',
    tag: 'Communication', size: 'bento-third',
  },
  {
    num: '06', icon: 'screen_share', title: 'Screen Sharing',
    desc: 'Demonstrate work, explain solutions, and resolve issues in real-time to improve collaboration.',
    tag: 'Collaboration', size: 'bento-third',
  },
  {
    num: '07', icon: 'gavel', title: 'Bidding System',
    desc: 'Post projects, receive competitive bids, and match with the right talent based on skills and timeline.',
    tag: 'Marketplace', size: 'bento-third',
  },
  {
    num: '08', icon: 'handshake', title: 'Collaborative Freelancing (Multi-Freelancer Projects)',
    desc: 'Two freelancers can collaborate on a single project, enabling skill-based teamwork, faster delivery, and higher-quality outcomes for clients.',
    tag: 'Teamwork', size: 'bento-half',
  },
  {
    num: '09', icon: 'leaderboard', title: 'Performance Leaderboard',
    desc: 'A performance-based leaderboard highlights top freelancers based on quality, consistency, and client feedback — helping clients quickly find reliable talent.',
    tag: 'Recognition', size: 'bento-half', featured: true,
  },
];

// Growth tools data
const growthCards = [
  {
    num: '12', icon: 'psychology', title: 'AI-Based Skill Verification',
    desc: 'Skills verified through AI-driven assessments — matched to projects by demonstrated capability, not self-declared expertise.',
    tag: 'AI', size: 'bento-third',
  },
  {
    num: '13', icon: 'newspaper', title: 'Tech News & Insights',
    desc: 'Real-time technology news and industry insights via APIs — stay updated with market trends and current technologies.',
    tag: 'Insights', size: 'bento-third', featured: true,
  },
  {
    num: '14', icon: 'school', title: 'Tutorial & Skill Learning',
    desc: 'Access basic tutorials for specific skills — upskill, bridge knowledge gaps, and prepare for real-world project requirements.',
    tag: 'Learning', size: 'bento-third',
  },
];

// Showcase items
const showcaseItems = [
  {
    icon: 'smart_toy', title: 'AI-Powered Client Assistance',
    desc: 'AI evaluates freelancer profiles, compares bids, and selects the best candidates based on skills and experience.',
  },
  {
    icon: 'task_alt', title: 'Task Tracking & Progress Monitoring',
    desc: 'Monitor milestones, timelines, and deliverables in real time, ensuring transparency and accountability.',
  },
  {
    icon: 'psychology', title: 'AI-Based Skill Verification',
    desc: 'Skills verified through AI-driven assessments, matching freelancers based on demonstrated capability.',
  },
];

const FeaturesPage = () => {
  const navigate = useNavigate();
  const cursorGlowRef = useRef<HTMLDivElement>(null);



  // Cursor glow effect
  useEffect(() => {
    const glow = cursorGlowRef.current;
    if (!glow) return;
    const handleMove = (e: MouseEvent) => {
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -80px 0px' }
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right,.reveal-scale,.stagger').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Counter animation
  useEffect(() => {
    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          const t = +(el.dataset.target || 0);
          const dur = 1800;
          const s = performance.now();
          const animate = (n: number) => {
            const p = Math.min((n - s) / dur, 1);
            const ease = 1 - Math.pow(1 - p, 4);
            el.textContent = String(Math.floor(ease * t));
            if (p < 1) requestAnimationFrame(animate);
            else el.textContent = String(t);
          };
          requestAnimationFrame(animate);
          cObs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll('.counter').forEach((c) => cObs.observe(c));
    return () => cObs.disconnect();
  }, []);

  // Bento card spotlight effect
  useEffect(() => {
    const cards = document.querySelectorAll('.bento-card');
    const handlers: Array<{ el: Element; handler: (e: Event) => void }> = [];
    cards.forEach((card) => {
      const handler = (e: Event) => {
        const me = e as MouseEvent;
        const r = (card as HTMLElement).getBoundingClientRect();
        (card as HTMLElement).style.setProperty('--mouse-x', (me.clientX - r.left) + 'px');
        (card as HTMLElement).style.setProperty('--mouse-y', (me.clientY - r.top) + 'px');
      };
      card.addEventListener('mousemove', handler);
      handlers.push({ el: card, handler });
    });
    return () => {
      handlers.forEach(({ el, handler }) => el.removeEventListener('mousemove', handler));
    };
  }, []);

  // Parallax orbs
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const cx = e.clientX / window.innerWidth - 0.5;
      const cy = e.clientY / window.innerHeight - 0.5;
      document.querySelectorAll('.orb').forEach((o, i) => {
        const f = (i + 1) * 20;
        (o as HTMLElement).style.transform = `translate(${cx * f}px,${cy * f}px)`;
      });
    };
    document.addEventListener('mousemove', handleMove);
    return () => document.removeEventListener('mousemove', handleMove);
  }, []);

  const scrollToFeatures = useCallback(() => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div className="landing-page">
      <Helmet>
        <title>Online Work for Students Platform Features Test | TheUnoia</title>
        <meta name="description" content="Explore TheUnoia platform features designed for online jobs for students, part-time online work, and easy ways to earn money for students online." />
        <link rel="canonical" href="https://www.theunoia.com/features" />
      </Helmet>
      {/* CURSOR GLOW */}
      <div className="cursor-glow" ref={cursorGlowRef}></div>

      <Navbar />

      {/* HERO */}
      <section className="feat-hero">
        <div className="hero-radial" style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
          <InteractiveDotGrid />
        </div>
        <div className="feat-hero-content">
          <div className="hero-eyebrow">
            <span className="icon-wrap">
              <span className="material-symbols-outlined">bolt</span>
            </span>
            Platform Features
          </div>
          <h1>
            <span className="line"><span className="line-inner">Everything You</span></span>
            <span className="line"><span className="line-inner">Need to <span className="gradient-text">Build</span>,</span></span>
            <span className="line"><span className="line-inner"><span className="gradient-text">Collaborate</span> &amp; <span className="accent-pill">Succeed</span></span></span>
          </h1>
          <p className="feat-hero-sub">
            A complete ecosystem for students and clients — from onboarding to delivery, powered by AI and built for real-world impact.
          </p>
          <div className="hero-actions">
            <button className="btn-hero-primary" onClick={scrollToFeatures}>Explore Features</button>
            <button className="btn-hero-secondary" onClick={() => navigate('/signup')}>Get Started Free →</button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="feat-stats reveal">
        <div className="feat-stat">
          <div className="feat-stat-num"><span className="counter" data-target="14">0</span>+</div>
          <div className="feat-stat-label">Core Features</div>
        </div>
        <div className="feat-stat">
          <div className="feat-stat-num"><span className="counter" data-target="100">0</span>%</div>
          <div className="feat-stat-label">Student Verified</div>
        </div>
        <div className="feat-stat">
          <div className="feat-stat-num"><span className="counter" data-target="2">0</span>x</div>
          <div className="feat-stat-label">Faster Delivery</div>
        </div>
        <div className="feat-stat">
          <div className="feat-stat-num" style={{ WebkitTextFillColor: 'unset', background: 'none', color: 'var(--lp-primary)' }}>AI</div>
          <div className="feat-stat-label">Powered Matching</div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="feat-marquee">
        <div className="feat-marquee-inner">
          {[...Array(2)].map((_, setIdx) =>
            marqueeItems.map((item, i) => (
              <Fragment key={`${setIdx}-${i}`}>
                <span className="feat-marquee-item">{item}</span>
                <span className="feat-marquee-sep"></span>
              </Fragment>
            ))
          )}
        </div>
      </div>

      {/* SECTION HEADER */}
      <div className="section-header reveal" id="features">
        <div className="section-tag">✦ Platform Capabilities</div>
        <h2 className="section-title">What we're strong at and <span className="hl-green">how we help</span> your journey</h2>
        <p className="section-desc">Every tool students and clients need — from onboarding to project delivery, all in one place.</p>
      </div>

      {/* BENTO GRID */}
      <div className="bento-grid stagger">
        {bentoCards.map((card) => (
          <div
            key={card.num}
            className={`bento-card ${card.size}${card.featured ? ' featured' : ''}`}
          >
            {card.hasVisual && (
              <div className="bento-visual">
                <div className="bento-visual-graphic"></div>
              </div>
            )}
            <span className="bento-num">{card.num}</span>
            <div className="bento-icon">
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <span className="bento-tag">{card.tag}</span>
          </div>
        ))}
      </div>

      {/* DARK SHOWCASE */}
      <section className="dark-showcase">
        <div className="dark-showcase-inner">
          <div className="reveal-left">
            <div className="section-tag">✦ AI Engine</div>
            <h2>Powered by <span className="hl-purple">AI</span>.<br />Built for <span className="hl-green">Growth</span>.</h2>
            <p className="dark-showcase-desc">Our AI engine understands context, verifies capability, and ensures every project gets the perfect match.</p>
            <div className="showcase-features">
              {showcaseItems.map((item, i) => (
                <div className="showcase-item" key={i}>
                  <div className="showcase-icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div className="showcase-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="showcase-visual reveal-right">
            <div className="showcase-ring"><div className="showcase-dot dot-1"></div></div>
            <div className="showcase-ring"><div className="showcase-dot dot-2"></div></div>
            <div className="showcase-ring"><div className="showcase-dot dot-3"></div></div>
            <div className="showcase-center">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
          </div>
        </div>
      </section>

      {/* GROWTH TOOLS */}
      <div className="section-header reveal">
        <div className="section-tag">✦ Growth Tools</div>
        <h2 className="section-title">Learn, Verify & <span style={{ color: 'var(--lp-secondary)' }}>Stay Ahead</span></h2>
        <p className="section-desc">Tools that help students grow their skills and stay updated with the latest in tech.</p>
      </div>

      <div className="bento-grid stagger">
        {growthCards.map((card) => (
          <div
            key={card.num}
            className={`bento-card ${card.size}${card.featured ? ' featured' : ''}`}
          >
            <span className="bento-num">{card.num}</span>
            <div className="bento-icon">
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.desc}</p>
            <span className="bento-tag">{card.tag}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <section className="feat-cta">
        <div className="cta-container reveal-scale">
          <h2>Ready to Experience the<br /><span className="gradient-text">Future of Freelancing</span>?</h2>
          <p>Join thousands of students and clients building amazing things on THEUNOiA.</p>
          <button className="btn-hero-primary" onClick={() => navigate('/signup')}>Get Started Today →</button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
