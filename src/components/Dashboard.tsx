import React from 'react';

const Dashboard = () => {
  return (
    <section className="bg-white flex w-full flex-col items-center py-20 px-5 md:px-20">
      <div className="flex w-full max-w-7xl flex-col items-center">
        <div className="bg-yellow flex items-center text-[13px] text-yellow-foreground font-medium w-fit px-6 py-2 rounded-full mb-6">
          Dashboard
        </div>
        <h2 className="text-foreground text-5xl font-bold tracking-tight text-center max-md:text-4xl">
          A clear and intuitive dashboard
        </h2>
        <p className="text-muted-foreground text-base font-normal text-center mt-6 max-w-3xl">
          Simplify project planning, streamline collaboration, and boost productivity.
        </p>
        <article className="bg-[#B8A3FF] w-full overflow-hidden mt-16 p-10 rounded-3xl max-md:mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col">
              <div className="bg-green flex items-center text-[13px] text-green-foreground font-medium w-fit px-4 py-2 rounded-2xl">
                Dashboard Overview
              </div>
              <h3 className="text-white text-4xl font-bold tracking-tight mt-7">
                Intuitive dashboard
              </h3>
              <p className="text-white text-[15px] font-medium leading-relaxed mt-8">
                THEUNOiA's dashboard is designed to give you everything you need at a glance.
              </p>
              <div className="flex gap-8 text-white font-bold mt-14 flex-wrap">
                <div className="flex items-center gap-3 text-lg">
                  <img src="https://api.builder.io/api/v1/image/assets/TEMP/2647d89ac28dd3ee4211a101db7d0e0ff9d0f5a6?placeholderIfAbsent=true" alt="" className="w-8 h-8" />
                  <div>Personalized task</div>
                </div>
                <div className="flex items-center gap-3 text-lg">
                  <img src="https://api.builder.io/api/v1/image/assets/TEMP/1c51346ce7eaed34468f3bcad93a4b1a6e1da9b7?placeholderIfAbsent=true" alt="" className="w-8 h-8" />
                  <div>Project overview</div>
                </div>
              </div>
              <div className="bg-white w-full mt-14 px-6 py-6 rounded-3xl">
                <div className="flex gap-5">
                  <div className="text-5xl font-bold text-foreground">6%</div>
                  <p className="text-muted-foreground text-[15px]">Experience the simplicity and power of THEUNOiA's dashboard.</p>
                </div>
              </div>
            </div>
            <img src="https://api.builder.io/api/v1/image/assets/TEMP/f32873261c4a20f0aea98b216ad75445e0d1dad2?placeholderIfAbsent=true" alt="Dashboard" className="w-full rounded-3xl" />
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
