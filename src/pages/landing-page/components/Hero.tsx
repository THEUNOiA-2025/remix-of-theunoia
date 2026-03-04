import { useEffect, useRef } from 'react';

const words = ['EXPERT.', 'ACCOUNTABLE.', 'QUALIFIED.', 'CREATIVITY.'];

const Hero = () => {
  const rotatorRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef(0);
  const busyRef = useRef(false);

  useEffect(() => {
    const rotateWords = () => {
      if (busyRef.current || !rotatorRef.current) return;
      busyRef.current = true;

      rotationRef.current += 90;
      const rotation = rotationRef.current;

      // Main rotation
      rotatorRef.current.style.transition = 'transform 0.85s cubic-bezier(.22,1,.36,1)';
      rotatorRef.current.style.transform = `translate3d(0,0,0) rotateX(${rotation}deg)`;

      // Micro settle effect
      setTimeout(() => {
        if (rotatorRef.current) {
          rotatorRef.current.style.transition = 'transform .25s ease-out';
          rotatorRef.current.style.transform = `translate3d(0,0,0) rotateX(${rotation - 3}deg)`;
        }
      }, 850);

      setTimeout(() => {
        if (rotatorRef.current) {
          rotatorRef.current.style.transform = `translate3d(0,0,0) rotateX(${rotation}deg)`;
          busyRef.current = false;
        }
      }, 1100);

      // Seamless loop reset
      if (rotation === 360) {
        setTimeout(() => {
          if (rotatorRef.current) {
            rotatorRef.current.style.transition = 'none';
            rotatorRef.current.style.transform = 'rotateX(0deg)';
            rotationRef.current = 0;
          }
        }, 1300);
      }
    };

    const interval = setInterval(rotateWords, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="landing-hero-wrap">
      <section className="landing-hero">
        <video
          className="landing-hero-bg"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/Video/demovid.mp4" type="video/mp4" />
        </video>

        <div className="landing-hero-overlay"></div>

        <div className="landing-hero-content">
          <div className="landing-hero-words">
            <div className="landing-hero-words-hidden">
              <div className="landing-hero-rotator" ref={rotatorRef}>
                {words.map((word, index) => (
                  <div className="landing-hero-face" key={index}>
                    <h1 className="landing-hero-word">{word}</h1>
                  </div>
                ))}
              </div>
            </div>

            <div className="hero-content-wrapper">
              <div className="landing-hero-text">
                You dream it. We deliver it.
              </div>
            </div>
          </div>

          <div className="demo-frame">
            <video
              className="demo-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src="/Video/Herovideo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>
    </section>
  );
};

export default Hero;
