import React from 'react';

const Testimonials = () => {
  const testimonials = [
    {
      rating: "https://api.builder.io/api/v1/image/assets/TEMP/8212c279d5c9d870655fcd2504963cc447e9c833?placeholderIfAbsent=true",
      title: "It's a total game-changer for our startup so far.",
      content: "THEUNOiA has transformed how my team collaborates! The intuitive task board and real-time update.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/65fe016601530e97f44abedc4d2b4128437e5663?placeholderIfAbsent=true",
      name: "Martin J.",
      role: "Co-Founder, Gradepie"
    },
    {
      rating: "https://api.builder.io/api/v1/image/assets/TEMP/2d69f6a1083fa6fb5e868f494f393faeaa3f4520?placeholderIfAbsent=true",
      title: "Our team collaboration has improved drastically!",
      content: "The dashboard gives us a clear view of tasks and deadlines, helping us deliver projects on time, every time.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/65a51ff2f4ba8efbd1089dafc0ab0e69d7d75cdd?placeholderIfAbsent=true",
      name: "James P.",
      role: "Software Engineer"
    },
    {
      rating: "https://api.builder.io/api/v1/image/assets/TEMP/5dfaf4b478df6af19e0223eda2b27c47659001be?placeholderIfAbsent=true",
      title: "The recurring task feature has been a lifesaver for me!",
      content: "THEUNOiA takes care of the small details so we can focus on what matters most. It's truly a productivity.",
      avatar: "https://api.builder.io/api/v1/image/assets/TEMP/06917c27e53db548512f81f9fe34ad3703a9bb5d?placeholderIfAbsent=true",
      name: "Emily R",
      role: "CMO, Artican"
    }
  ];

  return (
    <section className="bg-white flex w-full flex-col overflow-hidden items-center pt-[142px] px-20 max-md:max-w-full max-md:pt-[100px] max-md:px-5">
      <div className="flex w-[1200px] max-w-full flex-col items-center">
        <h2 className="text-foreground text-[53px] font-bold leading-none tracking-[-1.5px] text-center max-md:max-w-full max-md:text-[40px]">
          What our users are saying
        </h2>
        <p className="text-muted-foreground text-[17px] font-normal leading-loose text-center mt-7 max-md:max-w-full">
          Simplify project planning, streamline collaboration, and boost productivity{" "}
        </p>
        <p className="text-muted-foreground text-[17px] font-normal leading-[31px] text-center">
          all with THEUNOiA task management solution
        </p>
        <div className="self-stretch mt-[55px] max-md:max-w-full max-md:mt-10">
          <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
            {testimonials.map((testimonial, index) => (
              <article key={index} className="w-[33%] max-md:w-full max-md:ml-0 flex">
                <div className="border flex w-full flex-col items-stretch px-[35px] py-10 rounded-[20px] border-border max-md:mt-6 max-md:px-5 hover-lift h-full">
                  <img
                    src={testimonial.rating}
                    alt="5 star rating"
                    className="aspect-[5.49] object-contain w-44 max-w-full"
                  />
                  <h3 className="text-foreground text-[23px] font-medium leading-[34px] tracking-[-0.5px] mt-[38px]">
                    {testimonial.title.split(' ').map((word, i) => (
                      i < testimonial.title.split(' ').length - 3 ? word + ' ' : 
                      i === testimonial.title.split(' ').length - 3 ? <><br key={i} />{word} </> : word + ' '
                    ))}
                  </h3>
                  <p className="text-muted-foreground text-[17px] font-normal leading-[31px] mt-3.5 max-md:mr-[5px]">
                    {testimonial.content.split(' ').map((word, i) => (
                      i < testimonial.content.split(' ').length - 3 ? word + ' ' : 
                      i === testimonial.content.split(' ').length - 3 ? <><br key={i} />{word} </> : word + ' '
                    ))}
                  </p>
                  <div className="flex items-stretch gap-4 mt-8">
                    <img
                      src={testimonial.avatar}
                      alt={`${testimonial.name} avatar`}
                      className="aspect-[1] object-contain w-14 shrink-0 rounded-[200px]"
                    />
                    <div className="flex flex-col items-stretch my-auto">
                      <div className="text-foreground text-[15px] font-bold leading-loose">
                        {testimonial.name}
                      </div>
                      <div className="text-muted-foreground text-[13px] font-medium leading-loose mt-[15px]">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
