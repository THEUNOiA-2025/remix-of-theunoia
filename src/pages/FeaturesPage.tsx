import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  MessageSquare, 
  Shield, 
  Clock, 
  Users, 
  Star, 
  Zap,
  FileCheck,
  Wallet,
  Bell,
  Search,
  Award,
  TrendingUp
} from 'lucide-react';

const FeaturesPage = () => {
  const mainFeatures = [
    {
      icon: MessageSquare,
      title: "In-App Messaging",
      description: "Communicate directly with freelancers through our secure messaging system. Share files, discuss requirements, and get real-time updates.",
      color: "bg-[#B8A3FF]"
    },
    {
      icon: Shield,
      title: "Verified Students",
      description: "All freelancers are verified students from recognized institutions, ensuring quality and trustworthiness for every project.",
      color: "bg-[#FFD86F]"
    },
    {
      icon: Clock,
      title: "Timeline Tracking",
      description: "Set deadlines and track progress in real-time. Get notified at every milestone to ensure timely delivery.",
      color: "bg-[#C8F070]"
    },
    {
      icon: Users,
      title: "Smart Bidding",
      description: "Receive competitive bids from skilled professionals. Compare proposals, portfolios, and reviews to make the best choice.",
      color: "bg-[#FFB8D0]"
    }
  ];

  const additionalFeatures = [
    { icon: FileCheck, title: "File Attachments", description: "Share documents, images, and project files seamlessly" },
    { icon: Wallet, title: "Secure Payments", description: "Safe and transparent payment processing" },
    { icon: Bell, title: "Smart Notifications", description: "Stay updated with real-time alerts and reminders" },
    { icon: Search, title: "Advanced Search", description: "Find the perfect freelancer with powerful filters" },
    { icon: Award, title: "Rating System", description: "Review and rate completed projects" },
    { icon: TrendingUp, title: "Progress Reports", description: "Visual progress tracking for all projects" }
  ];

  return (
    <div className="bg-white overflow-hidden min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="flex w-full max-w-6xl flex-col items-center">
            <div className="bg-green flex items-center text-[13px] text-green-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
              Features
            </div>
            <h1 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
              Everything you need to <br />
              get work done
            </h1>
            <p className="text-muted-foreground text-lg font-normal text-center mt-8 max-w-3xl">
              THEUNOiA provides a complete suite of tools to connect clients with talented student freelancers, 
              making project management seamless and efficient.
            </p>
          </div>
        </section>

        {/* Main Features Grid */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mainFeatures.map((feature, index) => (
                <article 
                  key={index} 
                  className={`${feature.color} p-10 rounded-3xl hover-lift transition-all duration-300`}
                >
                  <div className="bg-background p-4 rounded-2xl w-fit">
                    <feature.icon className="h-8 w-8 text-foreground" />
                  </div>
                  <h3 className="text-foreground text-2xl font-bold mt-6">
                    {feature.title}
                  </h3>
                  <p className="text-foreground/80 text-base leading-relaxed mt-4">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="w-full max-w-6xl">
            <h2 className="text-foreground text-4xl font-bold text-center mb-4">
              And much more...
            </h2>
            <p className="text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
              Discover all the tools designed to make your freelancing experience smooth and productive.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-3xl hover-lift transition-all duration-300 border border-border/50"
                >
                  <div className="bg-primary/10 p-3 rounded-xl w-fit">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-foreground text-lg font-bold mt-5">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="bg-yellow w-full max-w-6xl p-16 rounded-[40px] text-center">
            <h2 className="text-yellow-foreground text-4xl font-bold mb-6">
              Ready to experience these features?
            </h2>
            <p className="text-yellow-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of students and clients already using THEUNOiA to get work done efficiently.
            </p>
            <a href="/signup">
              <button className="bg-foreground text-background font-bold px-10 py-5 rounded-full hover:opacity-90 transition-opacity">
                Get Started Free
              </button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
