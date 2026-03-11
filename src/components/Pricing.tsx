import React, { useState } from 'react';
const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);
  const plans = [{
    name: "Basic",
    description: "For small teams & startups",
    price: "₹1999.99",
    features: ["Up to 5 users", "Unlimited Tasks & Projects", "Basic Task Board & Calendar View", "File Sharing & Attachments", "Real-Time Notifications"]
  }, {
    name: "Advance",
    description: "For large teams & enterprises",
    price: "₹3499.00",
    features: ["Unlimited Users", "All Growth Features", "Custom Workflows & Dashboards", "Dedicated Account Manager", "24/7 Priority Support"]
  }];
  return <section className="bg-white flex w-full flex-col items-center pt-[142px] px-20 max-md:max-w-full max-md:pt-[100px] max-md:px-5">
      
    </section>;
};
export default Pricing;