import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import IntroSection from './components/IntroSection';
import ScrollIntro from './components/ScrollIntro';
import ServicesSection from './components/ServicesSection';
import StatsGrid from './components/StatsGrid';
import Testimonials from './components/Testimonials';
import TypographySection from './components/TypographySection';
import ContactHero from './components/ContactHero';
import Footer from './components/Footer';
import './styles.css';

const LandingPage = () => {
  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="landing-page">
      <Helmet>
        <title>Hire Top Freelancers Online | Part Time Online Work – TheUnoia</title>
        <meta name="description" content="Find the best online jobs for students. Start part-time online work, a job at home for students, and earn money online while studying with TheUnoia." />
        <link rel="canonical" href="https://www.theunoia.com/" />
      </Helmet>
      <Navbar />
      <Hero />
      <IntroSection />
      <ScrollIntro/>
      <ServicesSection />
      <StatsGrid />
      <Testimonials />
      <TypographySection />
      <ContactHero />
      <Footer />
    </div>
  );
};

export default LandingPage;
