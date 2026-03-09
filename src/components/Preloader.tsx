const logo = "/images/logo.png";

const quotes = [
  "Awaken Intelligence.",
  "Where Talent Meets Opportunity.",
  "Empowering Student Freelancers.",
  "THEUNOiA is Initializing...",
];

const Preloader = () => {

  const randomQuote =
    quotes[Math.floor(Math.random() * quotes.length)];

  return (

    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">


      {/* Skeleton Background */}

      <div className="absolute inset-0 animate-pulse opacity-30">

        <div className="h-full w-full bg-gradient-to-br from-muted via-background to-muted" />

      </div>



      {/* Logo */}

      <img

        src={logo}

        className="relative w-20 animate-pulseLogo"

      />



      {/* Quote */}

      <p className="relative mt-6 text-muted-foreground text-sm animate-pulse">

        {randomQuote}

      </p>


    </div>

  );

};

export default Preloader;