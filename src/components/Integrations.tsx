import React from 'react';

const Integrations = () => {
  return (
    <section className="bg-white flex w-full flex-col items-center text-foreground font-bold py-20 px-5 md:px-20">
      <div className="flex w-full max-w-6xl flex-col items-center">
        <h2 className="text-5xl tracking-tight text-center max-md:text-4xl">
          Integrations with your favorite tools
        </h2>
        <p className="text-muted-foreground text-base font-normal text-center mt-8 max-w-3xl">
          Simplify project planning, streamline collaboration, and boost productivity all with THEUNOiA task management solution
        </p>
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/1eda6933a10e92a9d9c6b29fff694b3c6619feef?placeholderIfAbsent=true"
          alt="Integration tools logos"
          className="w-full object-contain mt-16 max-md:mt-10"
        />
        <button className="border border-muted-foreground/50 flex items-center justify-center text-[15px] mt-16 px-8 py-5 rounded-full hover:bg-secondary transition-colors">
          Explore All Integrations
        </button>
      </div>
    </section>
  );
};

export default Integrations;
