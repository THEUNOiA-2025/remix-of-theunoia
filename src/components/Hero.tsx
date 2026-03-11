import React from 'react';

const Hero = () => {
  return (
    <section className="flex w-full flex-col overflow-hidden items-stretch pb-24 max-md:pb-16">
      <div className="flex w-full flex-col items-center">
        <div className="bg-secondary flex w-fit items-center gap-2 mt-20 px-6 py-2 rounded-full max-md:mt-10 animate-subtle-fade">
          <div className="flex -space-x-1">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/0cc57d49534d4c00e23b9909961e0307c1e85614?placeholderIfAbsent=true"
              alt="Review star"
              className="aspect-square object-contain w-6"
            />
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/a0c88b1f58cd88c52c0296624a4a24a443bfa52e?placeholderIfAbsent=true"
              alt="Review star"
              className="aspect-square object-contain w-6"
            />
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/d793241951660d8bc0b33bc1f3607bc69de9c903?placeholderIfAbsent=true"
              alt="Review star"
              className="aspect-square object-contain w-6"
            />
          </div>
          <div className="text-foreground text-[15px] font-medium">
            4900+ 5 Stars Reviews
          </div>
        </div>
        <h1 className="text-foreground text-6xl font-bold tracking-tight text-center mt-10 max-md:text-4xl animate-subtle-fade animation-delay-200">
          A Platform where Skills
        </h1>
      </div>
      <div className="self-center flex w-[961px] max-w-full flex-col mt-8 animate-subtle-fade animation-delay-400">
        <div className="bg-secondary flex items-center text-[13px] text-foreground font-medium w-fit px-4 py-2 rounded-2xl rounded-tl-none">
          <div>You</div>
        </div>
        <div className="self-center z-10 -mt-20 w-[635px] max-w-full flex flex-col items-stretch text-foreground font-bold">
          <h2 className="text-6xl tracking-tight text-center max-md:text-4xl">
            Create Opportunity
          </h2>
          <p className="text-muted-foreground text-lg font-normal text-center mt-8 max-md:text-base">
            From finding skilled people for your daily needs to helping students learn
          </p>
          <p className="text-muted-foreground text-lg font-normal text-center mt-2 max-md:text-base">
            and earn — we connect work, learning, and growth in one ecosystem.
          </p>
          <div className="self-center flex max-w-full items-center gap-4 text-[15px] flex-wrap mt-8 justify-center">
            <button className="bg-yellow flex items-center justify-center text-yellow-foreground font-bold px-10 py-4 rounded-full hover:opacity-90 transition-opacity">
              Post Work
            </button>
            <button className="bg-secondary flex items-center justify-center text-foreground font-bold px-11 py-4 rounded-full hover:bg-muted transition-colors">
              Find Work
            </button>
            <button className="border border-yellow flex items-center justify-center text-foreground font-bold px-6 py-4 rounded-full hover:bg-yellow/10 transition-colors">
              Explore Internship
            </button>
          </div>
        </div>
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/676c30ae9e253ef47d7b6283338c34d314654e80?placeholderIfAbsent=true"
          alt="Decorative element"
          className="aspect-[1.33] object-contain w-20 self-end mt-6"
        />
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/526d243cb5ae523a9deb28e7614bc18da4d1ed39?placeholderIfAbsent=true"
          alt="Decorative element"
          className="aspect-[1.33] object-contain w-20 -mt-10"
        />
        <img
          src="/images/dashboard-hero.png"
          alt="Platform dashboard preview"
          className="aspect-[1.45] object-contain w-full max-w-4xl mx-auto rounded-3xl animate-subtle-fade animation-delay-600"
        />
      </div>
    </section>
  );
};

export default Hero;
