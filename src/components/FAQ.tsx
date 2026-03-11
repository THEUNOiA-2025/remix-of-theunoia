import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: "What is THEUNOiA?",
      answer: "THEUNOiA is a task management platform designed for startups and growing teams. It helps you organize projects."
    },
    {
      question: "Can I integrate THEUNOiA with other tools?",
      answer: "Yes, THEUNOiA integrates with popular tools like Slack, Google Drive, and more."
    },
    {
      question: "Is THEUNOiA mobile-friendly?",
      answer: "Absolutely! THEUNOiA is fully responsive and works great on all devices."
    },
    {
      question: "What kind of support does THEUNOiA offer?",
      answer: "We offer 24/7 support through email, chat, and phone for all our users."
    },
    {
      question: "Can I try THEUNOiA for free?",
      answer: "Yes, we offer a 14-day free trial with full access to all features."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <section className="bg-white flex w-full flex-col items-center pt-[130px] pb-20 px-20 max-md:max-w-full max-md:pt-[100px] max-md:px-5">
      <div className="w-[1200px] max-w-full">
        <div className="flex w-full flex-col items-stretch px-10 max-md:max-w-full max-md:px-5">
          <div className="max-md:max-w-full">
            <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
              <div className="w-6/12 max-md:w-full max-md:ml-0">
                <div className="flex flex-col items-stretch mt-3.5 max-md:max-w-full max-md:mt-10">
                  <h2 className="text-foreground text-[51px] font-bold leading-[67px] tracking-[-1.5px] max-md:text-[40px] max-md:leading-[58px]">
                    Frequently <br />
                    asked questions
                  </h2>
                  <p className="text-muted-foreground text-[17px] font-normal leading-[31px] mt-[30px] max-md:max-w-full">
                    For any unanswered questions, reach out to our support team <br className="max-md:hidden" />
                    via email. We'll respond as soon as possible to assist you.
                  </p>
                </div>
              </div>
              <div className="w-6/12 ml-5 max-md:w-full max-md:ml-0">
                <div className="flex flex-col items-stretch text-[17px] max-md:max-w-full max-md:mt-10 space-y-3">
                  {faqs.map((faq, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "border rounded-2xl border-border overflow-hidden transition-all duration-200",
                        openFaq === index ? "bg-muted/30" : "bg-background"
                      )}
                    >
                      <button
                        onClick={() => toggleFaq(index)}
                        className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-muted/20 transition-colors"
                        aria-expanded={openFaq === index}
                      >
                        <span className="text-foreground font-bold leading-relaxed pr-4">
                          {faq.question}
                        </span>
                        <ChevronDown 
                          className={cn(
                            "w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200",
                            openFaq === index && "rotate-180"
                          )}
                        />
                      </button>
                      <div 
                        className={cn(
                          "overflow-hidden transition-all duration-200",
                          openFaq === index ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                        )}
                      >
                        <p className="text-muted-foreground font-normal leading-[31px] px-6 pb-5">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-yellow w-full overflow-hidden mt-28 px-[67px] py-[50px] rounded-[40px] max-md:max-w-full max-md:mt-10 max-md:px-5">
            <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
              <div className="w-6/12 max-md:w-full max-md:ml-0">
                <div className="flex flex-col self-stretch font-bold my-auto max-md:max-w-full max-md:mt-10">
                  <h2 className="text-yellow-foreground text-[37px] leading-[52px] tracking-[-1px]">
                    Get You Work Done
                    <br />
                    within days, not weeks!
                  </h2>
                  <p className="text-yellow-foreground text-[17px] font-normal leading-[31px] self-stretch mt-[26px] max-md:max-w-full">
                    THEUNOiA is the ultimate SaaS & startup tool to help you get your work done, As well as skill up and get guaranteed Internships
                  </p>
                  <button className="bg-foreground flex flex-col overflow-hidden items-stretch text-[15px] text-background leading-loose justify-center mt-[38px] px-[30px] py-[18px] rounded-[100px] max-md:px-5 hover:opacity-90 transition-opacity">
                    Get This Template
                  </button>
                </div>
              </div>
              <div className="w-6/12 ml-5 max-md:w-full max-md:ml-0">
                <div className="grow max-md:max-w-full max-md:mt-10">
                  <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
                    <div className="w-[35%] max-md:w-full max-md:ml-0">
                      <div className="flex flex-col self-stretch my-auto max-md:mt-[27px]">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/2dd0053a29b40ab2d88965826ad61f66eb6ecea0?placeholderIfAbsent=true"
                          alt="Template preview"
                          className="aspect-[3.29] object-contain w-[148px] ml-[17px] max-md:ml-2.5"
                        />
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/6be3c7603601d08bcea5196a60f40275d73fe674?placeholderIfAbsent=true"
                          alt="Template preview"
                          className="aspect-[0.57] object-contain w-[155px] mt-4 rounded-3xl"
                        />
                      </div>
                    </div>
                    <div className="w-[65%] ml-5 max-md:w-full max-md:ml-0">
                      <div className="grow max-md:mt-1.5">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/bdb580ba0abea17350651fc7fd46b822020d62dd?placeholderIfAbsent=true"
                          alt="Template preview"
                          className="aspect-[1.59] object-contain w-full rounded-3xl"
                        />
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/4a8327138e2a2c8f4858baaaa4c31b0677317c19?placeholderIfAbsent=true"
                          alt="Template preview"
                          className="aspect-[1.55] object-contain w-full mt-4 rounded-3xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
