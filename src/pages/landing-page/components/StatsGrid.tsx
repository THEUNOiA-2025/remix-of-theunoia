import { useEffect, useRef, useState } from 'react';

const statsData = [
  {
    heading: 'COLLEGE STUDENTS',
    number: '45M+',
    image: '/images/collegestudents.png',
    text: 'A massive talent pool ready to contribute',
  },
  {
    heading: 'FINANCIALLY DEPENDENT STUDENTS',
    number: '31M+',
    image: '/images/financiallydependent.png',
    text: 'Looking for income opportunity',
  },
  {
    heading: 'FINANCIALLY INDEPENDENT STUDENTS',
    number: '14M+',
    image: '/images/financiallyindependent.png',
    text: 'Already earning while studying',
  },
  {
    heading: 'SKILLED BUT NOT EARNING',
    number: '19M+',
    image: '/images/skilledbutnotearning.png',
    text: 'Talent waiting for the right platform',
  },
  {
    heading: '', // Empty cell
    number: '',
    image: '',
    text: '',
  },
  {
    heading: 'STUDENT FREELANCERS',
    number: '9M+',
    image: '/images/studentfreelancers.png',
    text: 'Actively working independently',
  },
  {
    heading: 'RECURRING CLIENTS',
    number: '22M+',
    image: '/images/recurringclients.png',
    text: 'Long-term and repeat freelance demand',
  },
  {
    heading: 'SME & STARTUPS',
    number: '63M+',
    image: '/images/sme&startups.png',
    text: "India's fast-growing businesses driving freelance demand",
  },
  {
    heading: 'TALENT GAPS',
    number: '41M+',
    image: '/images/talentgaps.png',
    text: 'Businesses struggling to find the right skills',
  },
];

// Easing function from the script
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

const StatsGrid = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !mainCardRef.current) return;

      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const total = section.offsetHeight - viewportHeight;

      // If section is completely above viewport (scrolled past)
      // Keep at final state
      if (rect.bottom < 0) {
        const finalScale = 1 / 3;
        mainCardRef.current.style.transform = `scale(${finalScale})`;
        setIsRevealed(true);
        return;
      }

      // If section is below viewport (not reached yet)
      // Reset to initial state
      if (rect.top > viewportHeight) {
        mainCardRef.current.style.transform = 'scale(1)';
        setIsRevealed(false);
        return;
      }

      // Calculate progress only when in viewport
      let progress = -rect.top / total;
      progress = Math.min(Math.max(progress, 0), 1);

      // Scale from 1 → 1/3 using easing
      const scale = 1 - ease(progress) * (1 - 1 / 3);
      mainCardRef.current.style.transform = `scale(${scale})`;

      // Reveal surrounding cards after shrink is visible (progress > 0.25)
      if (progress > 0.25) {
        setIsRevealed(true);
      } else {
        setIsRevealed(false);
      }
    };

    // Set initial state explicitly before adding listeners
    if (mainCardRef.current) {
      mainCardRef.current.style.transform = 'scale(1)';
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Delayed initial check to ensure layout has settled
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="sticky-root">
      <section className="landing-section" ref={sectionRef} id="section">
        <div className="landing-sticky" ref={stickyRef} id="sticky">
          <div className={`landing-grid ${isRevealed ? 'grid-revealed' : ''}`}>
            {statsData.map((stat, index) => (
              <div className="landing-cell" key={index}>
                {stat.heading && (
                  <div className="cell-card premium">
                    <img src={stat.image} alt={stat.heading || 'Stat image'} className="cell-bg-image" />
                  </div>
                )}
              </div>
            ))}

            {/* Main Card */}
            <div className="main-card" ref={mainCardRef}>
              <div className="main-card-heading">
                Turning Student <br /> To Talents !
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StatsGrid;
