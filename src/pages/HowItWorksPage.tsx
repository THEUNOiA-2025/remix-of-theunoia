import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, 
  Users, 
  MessageCircle, 
  CheckCircle,
  ArrowRight,
  Briefcase,
  GraduationCap
} from 'lucide-react';

const HowItWorksPage = () => {
  const clientSteps = [
    {
      step: "01",
      icon: FileText,
      title: "Post Your Project",
      description: "Describe your requirements, set a budget, and specify your timeline. Whether it's web development, design, content writing, or tutoring — we've got you covered.",
      color: "bg-[#B8A3FF]"
    },
    {
      step: "02",
      icon: Users,
      title: "Receive Bids",
      description: "Verified student freelancers will review your project and submit competitive bids. Compare proposals, check portfolios, and read reviews.",
      color: "bg-[#FFD86F]"
    },
    {
      step: "03",
      icon: MessageCircle,
      title: "Chat & Select",
      description: "Use our in-app messaging to discuss details with bidders. Ask questions, clarify requirements, and choose the best fit for your project.",
      color: "bg-[#C8F070]"
    },
    {
      step: "04",
      icon: CheckCircle,
      title: "Get It Done",
      description: "Track progress in real-time, communicate throughout the project, and receive quality work delivered on time. Rate and review upon completion.",
      color: "bg-[#FFB8D0]"
    }
  ];

  const freelancerSteps = [
    {
      step: "01",
      title: "Verify Your Student Status",
      description: "Sign up and complete our simple student verification process using your college email or ID card."
    },
    {
      step: "02",
      title: "Build Your Profile",
      description: "Showcase your skills, add portfolio items, and set your hourly rates to attract clients."
    },
    {
      step: "03",
      title: "Browse & Bid on Projects",
      description: "Find projects that match your skills and submit competitive proposals with your approach."
    },
    {
      step: "04",
      title: "Deliver & Get Paid",
      description: "Complete the work, receive great reviews, and build your reputation on the platform."
    }
  ];

  return (
    <div className="bg-white overflow-hidden min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="flex w-full max-w-6xl flex-col items-center">
            <div className="bg-yellow flex items-center text-[13px] text-yellow-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
              How It Works
            </div>
            <h1 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
              Simple steps to <br />
              success
            </h1>
            <p className="text-muted-foreground text-lg font-normal text-center mt-8 max-w-3xl">
              Whether you're looking to hire talented students or earn while you learn, 
              THEUNOiA makes the process straightforward and secure.
            </p>
          </div>
        </section>

        {/* For Clients Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="w-full max-w-6xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-primary p-3 rounded-xl">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <h2 className="text-foreground text-3xl font-bold">For Clients</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {clientSteps.map((item, index) => (
                <div 
                  key={index} 
                  className={`${item.color} p-8 rounded-3xl hover-lift transition-all duration-300 relative overflow-hidden`}
                >
                  <span className="absolute top-6 right-6 text-6xl font-bold text-foreground/10">
                    {item.step}
                  </span>
                  <div className="bg-background p-3 rounded-xl w-fit">
                    <item.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="text-foreground text-xl font-bold mt-5">
                    {item.title}
                  </h3>
                  <p className="text-foreground/80 text-sm leading-relaxed mt-3">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* For Freelancers Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="w-full max-w-6xl">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#C8F070] p-3 rounded-xl">
                <GraduationCap className="h-6 w-6 text-foreground" />
              </div>
              <h2 className="text-foreground text-3xl font-bold">For Student Freelancers</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {freelancerSteps.map((item, index) => (
                <div 
                  key={index} 
                  className="bg-white p-8 rounded-3xl hover-lift transition-all duration-300 border border-border/50 relative"
                >
                  <div className="bg-green text-green-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-5">
                    {item.step}
                  </div>
                  <h3 className="text-foreground text-lg font-bold">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-3">
                    {item.description}
                  </p>
                  {index < freelancerSteps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/30 h-6 w-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="w-full max-w-6xl">
            <h2 className="text-foreground text-4xl font-bold text-center mb-16">
              Why THEUNOiA?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#B8A3FF] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-foreground">100%</span>
                </div>
                <h3 className="text-foreground text-xl font-bold mb-2">Verified Students</h3>
                <p className="text-muted-foreground">Every freelancer is a verified student from a recognized institution</p>
              </div>
              <div className="text-center">
                <div className="bg-[#FFD86F] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-foreground">24h</span>
                </div>
                <h3 className="text-foreground text-xl font-bold mb-2">Quick Responses</h3>
                <p className="text-muted-foreground">Get bids and responses within 24 hours of posting</p>
              </div>
              <div className="text-center">
                <div className="bg-[#C8F070] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl font-bold text-foreground">0%</span>
                </div>
                <h3 className="text-foreground text-xl font-bold mb-2">No Hidden Fees</h3>
                <p className="text-muted-foreground">Transparent pricing with no surprise charges</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="bg-primary w-full max-w-6xl p-16 rounded-[40px] text-center">
            <h2 className="text-primary-foreground text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-10 max-w-2xl mx-auto">
              Join the growing community of students and clients making work happen.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <a href="/signup">
                <button className="bg-background text-foreground font-bold px-10 py-5 rounded-full hover:opacity-90 transition-opacity">
                  Post a Project
                </button>
              </a>
              <a href="/signup">
                <button className="bg-transparent border-2 border-primary-foreground text-primary-foreground font-bold px-10 py-5 rounded-full hover:bg-primary-foreground/10 transition-colors">
                  Become a Freelancer
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorksPage;
