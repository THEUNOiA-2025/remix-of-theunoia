import React, { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ChevronDown, ChevronUp, HelpCircle, MessageCircle } from 'lucide-react';

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqCategories = [
    {
      category: "General",
      color: "bg-[#B8A3FF]",
      faqs: [
        {
          question: "What is THEUNOiA?",
          answer: "THEUNOiA is a freelance marketplace exclusively for verified college students. It connects clients who need work done with talented students who can deliver quality results while earning and building their portfolios."
        },
        {
          question: "Who can use THEUNOiA?",
          answer: "Anyone can post projects as a client. However, to work as a freelancer on the platform, you must be a verified student at a recognized educational institution."
        },
        {
          question: "Is THEUNOiA available in my city?",
          answer: "THEUNOiA operates across India with verified students from colleges nationwide. Whether you're in a metro city or a smaller town, you can find talented students to work on your projects."
        }
      ]
    },
    {
      category: "For Clients",
      color: "bg-[#FFD86F]",
      faqs: [
        {
          question: "How do I post a project?",
          answer: "After signing up, click on 'Post a Project' from your dashboard. Describe your requirements, set a budget range, specify the timeline, and add any relevant files or images. Your project will be visible to verified freelancers who can then submit bids."
        },
        {
          question: "How do I choose the right freelancer?",
          answer: "Review the bids you receive, check each freelancer's profile including their skills, portfolio, ratings, and reviews from previous clients. Use the in-app chat to ask questions and clarify requirements before making your decision."
        },
        {
          question: "What if I'm not satisfied with the work?",
          answer: "We encourage clear communication throughout the project. If there are issues, discuss them with the freelancer first. If problems persist, you can reach out to our support team for mediation and resolution."
        },
        {
          question: "How does payment work?",
          answer: "Payments are handled securely through the platform. You'll agree on a price with your chosen freelancer, and payment is released upon satisfactory completion of the project."
        }
      ]
    },
    {
      category: "For Freelancers",
      color: "bg-[#C8F070]",
      faqs: [
        {
          question: "How do I get verified as a student?",
          answer: "After signing up, go to the verification section in your profile. You can verify using your college email address (we'll send a verification code) or by uploading your student ID card. Verification is typically completed within 24-48 hours."
        },
        {
          question: "How do I get my first project?",
          answer: "Complete your profile with your skills, portfolio items, and a compelling bio. Browse available projects that match your skills, and submit thoughtful, personalized proposals. Your first few projects are key to building reviews, so consider competitive pricing initially."
        },
        {
          question: "What skills are in demand?",
          answer: "Popular categories include web development, mobile app development, graphic design, content writing, video editing, social media management, tutoring, data entry, and research assistance. However, clients post diverse needs, so most skills can find opportunities."
        },
        {
          question: "How do I get paid?",
          answer: "Payments are processed through the platform once the client approves your completed work. You can withdraw your earnings to your bank account. Payment timelines and methods are clearly shown in your dashboard."
        }
      ]
    },
    {
      category: "Account & Security",
      color: "bg-[#FFB8D0]",
      faqs: [
        {
          question: "How is my data protected?",
          answer: "We use industry-standard encryption and security practices to protect your personal information. Your data is stored securely and never shared with third parties without your consent."
        },
        {
          question: "Can I delete my account?",
          answer: "Yes, you can request account deletion from your settings. Note that this will remove all your data, projects, and reviews from the platform permanently."
        },
        {
          question: "What if I forget my password?",
          answer: "Click 'Forgot Password' on the login page. We'll send a password reset link to your registered email address. If you're having trouble, contact our support team."
        }
      ]
    }
  ];

  const toggleFaq = (categoryIndex: number, faqIndex: number) => {
    const globalIndex = categoryIndex * 100 + faqIndex;
    setOpenIndex(openIndex === globalIndex ? null : globalIndex);
  };

  return (
    <div className="bg-white overflow-hidden min-h-screen">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20 bg-[#F8F4F1]">
          <div className="flex w-full max-w-6xl flex-col items-center">
            <div className="bg-primary flex items-center text-[13px] text-primary-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
              FAQ
            </div>
            <h1 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
              Frequently Asked <br />
              Questions
            </h1>
            <p className="text-muted-foreground text-lg font-normal text-center mt-8 max-w-3xl">
              Find answers to common questions about using THEUNOiA. 
              Can't find what you're looking for? Reach out to our support team.
            </p>
          </div>
        </section>

        {/* FAQ Categories */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="w-full max-w-4xl">
            {faqCategories.map((category, categoryIndex) => (
              <div key={categoryIndex} className="mb-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`${category.color} p-2 rounded-xl`}>
                    <HelpCircle className="h-5 w-5 text-foreground" />
                  </div>
                  <h2 className="text-foreground text-2xl font-bold">{category.category}</h2>
                </div>
                
                <div className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => {
                    const globalIndex = categoryIndex * 100 + faqIndex;
                    const isOpen = openIndex === globalIndex;
                    
                    return (
                      <div 
                        key={faqIndex} 
                        className={`border border-border rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-[#F8F4F1]' : 'bg-white hover:bg-[#F8F4F1]/50'}`}
                      >
                        <button
                          onClick={() => toggleFaq(categoryIndex, faqIndex)}
                          className="w-full flex items-center justify-between p-6 text-left"
                        >
                          <span className="text-foreground font-semibold pr-4">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-6">
                            <p className="text-muted-foreground leading-relaxed">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Still Have Questions */}
        <section className="flex w-full flex-col items-center py-20 px-5 md:px-20">
          <div className="bg-yellow w-full max-w-4xl p-16 rounded-[40px] text-center">
            <div className="bg-yellow-foreground/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="h-8 w-8 text-yellow-foreground" />
            </div>
            <h2 className="text-yellow-foreground text-3xl font-bold mb-4">
              Still have questions?
            </h2>
            <p className="text-yellow-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Our support team is here to help. Reach out and we'll get back to you as soon as possible.
            </p>
            <a href="/contact">
              <button className="bg-foreground text-background font-bold px-10 py-5 rounded-full hover:opacity-90 transition-opacity">
                Contact Support
              </button>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default FAQPage;
