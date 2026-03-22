import React from 'react';

const HowItWorks = () => {
  const steps = [
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/1f395db4e05f764d600b58f5486f0b63a2d34e83?placeholderIfAbsent=true",
      title: "Post Your Requirement",
      description: "List what you need — be it tech help, home repair, design work, or tutoring.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/87844c8bbdd86b41c874e436d5bfedd53b1bd851?placeholderIfAbsent=true"
    },
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/c06c9edddbd1f5be28e2d73e254a9dd502b08070?placeholderIfAbsent=true",
      title: "Get Skilled Bids",
      description: "Skilled freelancers will bid on your project. Review offers, chat, and pick the best fit.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/d3ee89c2f191e78781ba79733c593b722a47d7d6?placeholderIfAbsent=true"
    },
    {
      icon: "https://api.builder.io/api/v1/image/assets/TEMP/6b46653cd469d4db0bf6df7957f4e7e6d8143f62?placeholderIfAbsent=true",
      title: "Get It Done — Hassle-Free",
      description: "Your chosen professional completes the task securely, while you track progress.",
      image: "https://api.builder.io/api/v1/image/assets/TEMP/185c9b7e9f9a70304e6678727553f6bcb72e8179?placeholderIfAbsent=true",
      bottomImage: "https://api.builder.io/api/v1/image/assets/TEMP/765a6e094228c45ea640e2b13ec863e41f741001?placeholderIfAbsent=true"
    }
  ];

  return (
    <section className="bg-white flex w-full flex-col items-center py-20 px-5 md:px-20">
      <div className="flex w-full max-w-7xl flex-col items-center">
        <div className="bg-yellow flex items-center text-[13px] text-yellow-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
          Why choose us
        </div>
        <h2 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
          How It Works
        </h2>
        <p className="text-muted-foreground text-base font-normal text-center mt-6 max-w-3xl">
          Getting things done is simple. Just post what you need, receive bids from skilled individuals, and pick the one that fits your budget and timeline.
        </p>
        <div className="w-full mt-16 max-md:mt-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((step, index) => (
              <article key={index} className="flex flex-col">
                <div className="bg-[#F8F4F1] flex flex-col w-full px-7 py-12 rounded-3xl h-full hover-lift">
                  <img
                    src={step.icon}
                    alt={`${step.title} icon`}
                    className="w-[60px] h-[60px] rounded-2xl object-contain"
                  />
                  <h3 className="text-foreground text-lg font-bold mt-6">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-[15px] font-normal leading-relaxed mt-7">
                    {step.description}
                  </p>
                  <img
                    src={step.image}
                    alt={`${step.title} illustration`}
                    className="w-full object-contain mt-12 rounded-xl max-md:mt-10"
                  />
                  {step.bottomImage && (
                    <img
                      src={step.bottomImage}
                      alt="Additional illustration"
                      className="w-[290px] self-center max-w-full mt-4 object-contain"
                    />
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
