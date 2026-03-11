import { useEffect, useRef, useState } from "react";

const IntroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [videoSectionVisible, setVideoSectionVisible] = useState(false);
  const [textSectionVisible, setTextSectionVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !squareRef.current || !contentRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const total = sectionRef.current.offsetHeight - viewportHeight;

      // Hide everything if section is not in viewport range
      if (rect.bottom < 0 || rect.top > viewportHeight) {
        squareRef.current.style.opacity = '0';
        squareRef.current.style.visibility = 'hidden';
        contentRef.current.style.opacity = '0';
        setHeaderVisible(false);
        setVideoSectionVisible(false);
        setTextSectionVisible(false);
        return;
      }

      // Section is in viewport - show and animate
      squareRef.current.style.opacity = '1';
      squareRef.current.style.visibility = 'visible';

      // Calculate progress
      let progress = -rect.top / total;
      progress = Math.min(Math.max(progress, 0), 1);

      // Square transform animation
      const scale = progress * 8;
      const rotate = progress * 720;
      squareRef.current.style.transform = `scale(${scale}) rotate(${rotate}deg)`;

      // Content fade and visibility
      if (progress > 0.05) {
        contentRef.current.style.opacity = String(Math.min((progress - 0.05) * 1.6, 1));

        if (progress > 0.1) setHeaderVisible(true);
        if (progress > 0.15) setVideoSectionVisible(true);
        if (progress > 0.2) setTextSectionVisible(true);
      } else {
        contentRef.current.style.opacity = '0';
        setHeaderVisible(false);
        setVideoSectionVisible(false);
        setTextSectionVisible(false);
      }
    };

    // Set initial state explicitly
    if (squareRef.current && contentRef.current) {
      squareRef.current.style.transform = 'scale(0) rotate(0deg)';
      squareRef.current.style.opacity = '0';
      squareRef.current.style.visibility = 'hidden';
      contentRef.current.style.opacity = '0';
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    // Delayed initial check
    const timeoutId = setTimeout(handleScroll, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && progressRef.current) {
      const progress =
        (videoRef.current.currentTime / videoRef.current.duration) * 100;
      progressRef.current.value = String(progress);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
    }
  };

  return (
    <section className="section-home-intro" ref={sectionRef}>
      <div className="sticky-wrapper">
        <div className="animation-square" ref={squareRef}></div>

        <div className="intro-content" ref={contentRef} style={{ opacity: 0 }}>
          <div className="intro-layout">
            {/* LEFT COLUMN */}
            <div className="intro-left">
              <div className={`intro-header ${headerVisible ? "visible" : ""}`}>
                <div className="intro-label">Why Skill Bridge</div>
                <h2 className="intro-main-title">
                  PAY ONLY FOR TALENT
                  <br />
                  NOT INFLATED FEES.
                </h2>
              </div>

              <div
                className={`intro-video-section ${videoSectionVisible ? "visible" : ""}`}
              >
                <div className="video-container">
                  <video
                    className="intro-video"
                    ref={videoRef}
                    loop
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                  >
                    <source src="/Video/sai.mp4" type="video/mp4" />
                  </video>

                  <div className="video-controls">
                    <button className="control-btn" onClick={togglePlay}>
                      {isPlaying ? "⏸" : "▶"}
                    </button>
                    <input
                      type="range"
                      className="video-progress"
                      ref={progressRef}
                      defaultValue="0"
                      onChange={handleProgressChange}
                    />
                    <button className="control-btn" onClick={toggleMute}>
                      {isMuted ? "🔇" : "🔊"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div
              className={`intro-text-section ${textSectionVisible ? "visible" : ""}`}
            >
              <div className="intro-card pricing-style">
                <h3 className="pricing-title">For Clients</h3>

                <div className="pricing-divider star"></div>

                <ul className="pricing-features">
                  <li>
                    <strong>Lower costs</strong>
                    <span>No platform inflation</span>
                  </li>
                  <li>
                    <strong>Fresh ideas</strong>
                    <span>Student-driven innovation</span>
                  </li>
                  <li>
                    <strong>Trust built-in</strong>
                    <span>Transparent contracts + refunds</span>
                  </li>
                  <li>
                    <strong>Simpler workflow</strong>
                    <span>No complexity, just results</span>
                  </li>
                </ul>

                <div className="pricing-divider"></div>

                <h4 className="pricing-subtitle">The Bigger Picture</h4>

                <p className="pricing-manifesto">
                  Breaking the certificate barrier.
                  <br />
                  Creating a student-first ecosystem.
                  <br />
                  Making work fair, accessible, and empowering.
                </p>

                <div className="pricing-cta">
                  We bridge the gap between student talent and real client
                  needs.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default IntroSection;
