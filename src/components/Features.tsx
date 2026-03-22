import React from 'react';

const Features = () => {
  return (
    <section className="bg-white flex w-full flex-col items-center py-20 px-5 md:px-20">
      <div className="flex w-full max-w-6xl flex-col items-center">
        <div className="bg-green flex items-center text-[13px] text-green-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
          Features
        </div>
        <h2 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
          Powerful features to <br />
          boost your work
        </h2>
        <p className="text-muted-foreground text-base font-normal text-center mt-8 max-w-3xl">
          Simplify project planning, streamline collaboration, and boost productivity all with THEUNOiA task management solution
        </p>
        <div className="w-full mt-16 max-md:mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <article className="flex flex-col">
              <div className="bg-[#B8A3FF] flex flex-col text-foreground font-medium w-full p-10 rounded-3xl h-full hover-lift">
                <div className="bg-background flex items-center text-[13px] text-muted-foreground w-fit px-4 py-2 rounded-2xl">
                  <div>In-app chat and real-time feedback</div>
                </div>
                <h3 className="text-[34px] font-bold tracking-tight mt-7">
                  Effortless Project Posting
                </h3>
                <p className="text-[15px] leading-relaxed mt-7">
                  Post your requirement in minutes — whether it's a website fix, or creative project. Add details, budget, and watch the bids roll in.
                </p>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/cc57800e6c3f9cdcb88b6b4888a08627af443194?placeholderIfAbsent=true"
                  alt="Project posting interface"
                  className="w-full object-contain mt-10"
                />
              </div>
            </article>
            <article className="flex flex-col">
              <div className="bg-[#FFD86F] flex flex-col text-foreground font-medium w-full p-10 rounded-3xl h-full hover-lift">
                <div className="bg-background flex items-center text-[13px] text-muted-foreground w-fit px-4 py-2 rounded-2xl">
                  <div>Task completion percentages for each task</div>
                </div>
                <h3 className="text-[34px] font-bold tracking-tight mt-7">
                  Smart Bidding System
                </h3>
                <p className="text-[15px] leading-relaxed mt-7">
                  Skilled freelancers and professionals bid for your project. Compare offers, chat directly, and choose the one that fits your needs.
                </p>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/817a6b52b93df25b1ed23a846a90bb8da6ccb7f6?placeholderIfAbsent=true"
                  alt="Bidding system interface"
                  className="w-full object-contain mt-10"
                />
              </div>
            </article>
          </div>
        </div>
        <article className="bg-[#C8F070] w-full overflow-hidden mt-5 p-10 rounded-3xl hover-lift">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col text-foreground font-medium my-auto">
              <div className="bg-background flex items-center text-[13px] text-muted-foreground w-fit px-4 py-2 rounded-2xl">
                <div>Daily, weekly, and monthly views for planning</div>
              </div>
              <h3 className="text-[34px] font-bold tracking-tight mt-7">
                Track Work & Get It Done On Time
              </h3>
              <p className="text-[15px] leading-relaxed mt-8">
                Stay updated as your chosen professional completes the task securely and on time. Track progress, communicate, and manage everything
              </p>
              <button className="bg-primary flex items-center justify-center text-base text-primary-foreground font-bold mt-12 px-8 py-5 rounded-full hover:opacity-90 transition-opacity w-fit">
                Book a Demo
              </button>
            </div>
            <div className="flex flex-col relative min-h-[468px] w-full overflow-hidden text-[13px] text-white font-medium">
              <img
                src="https://api.builder.io/api/v1/image/assets/TEMP/17ce5205b3001d63862a50784c25bbb06e3d0537?placeholderIfAbsent=true"
                alt="Work tracking interface"
                className="absolute h-full w-full object-cover inset-0 rounded-2xl"
              />
              <div className="relative flex items-start gap-1 mt-44">
                <div className="bg-accent flex items-center text-accent-foreground px-5 py-2 rounded-2xl rounded-tl-none">
                  <div>Charles</div>
                </div>
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/1f79dcb76b4cbbbbce53b41114600d6941770953?placeholderIfAbsent=true"
                  alt="Chat indicator"
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
};

export default Features;
