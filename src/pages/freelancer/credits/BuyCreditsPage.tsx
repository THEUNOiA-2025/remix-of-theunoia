import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsFreelancer } from '@/hooks/useIsFreelancer';
import { FreeTokenPolicySection } from '@/components/credits/FreeTokenPolicySection';

const BuyCreditsPage = () => {
  const navigate = useNavigate();
  const { isFreelancer, isLoading } = useIsFreelancer();

  useEffect(() => {
    if (isLoading) return;
    if (!isFreelancer) {
      navigate('/dashboard', { replace: true });
    }
  }, [isFreelancer, isLoading, navigate]);

  const handleSelectPlan = (planId: string) => {
    navigate(`/checkout?plan=${planId}`);
  };

  if (isLoading || !isFreelancer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
      <main className="max-w-[1200px] mx-auto px-6 pt-4 pb-10 lg:pt-6 lg:pb-12">
        {/* Free Token Policy – freelancers only */}
        <section className="mb-16">
          <FreeTokenPolicySection />
        </section>

        {/* Heading Section */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-[#111118] mb-4 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="text-base text-[#60608a] font-medium">
            Choose the token package that fits your enterprise needs. Professional tools for professional teams.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Starter Card */}
          <div className="bg-white rounded-xl p-8 border border-[#dbdbe6] premium-shadow flex flex-col h-full hover:translate-y-[-4px] transition-transform duration-300">
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#60608a] mb-4">Starter</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#111118]">₹99</span>
                <span className="text-sm font-semibold text-[#60608a]">/ package</span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#7e63f8] bg-[#7e63f8]/5 inline-block px-3 py-1.5 rounded-full">
                100 Tokens <span className="mx-1 opacity-40">•</span> ₹1/token
              </p>
            </div>
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#7e63f8] bg-[#7e63f8]/10 rounded-full p-0.5" style={{ fontSize: '18px' }}>check</span>
                  Basic Support
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#7e63f8] bg-[#7e63f8]/10 rounded-full p-0.5" style={{ fontSize: '18px' }}>check</span>
                  7-day validity
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#60608a] line-through">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  Bonus Skill Tests
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#60608a] line-through">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  Exclusive Badge
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPlan('starter')}
              className="w-full py-4 rounded-xl bg-[#f0f0f5] text-[#111118] text-sm font-bold hover:bg-[#e2e2eb] transition-all"
            >
              Get Started
            </button>
          </div>

          {/* Value Card */}
          <div className="bg-white rounded-xl p-8 border-2 border-[#fbdd84] premium-shadow flex flex-col h-full relative hover:translate-y-[-4px] transition-transform duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#fbdd84] text-[#111118] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">
                Best Value
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#60608a] mb-4">Value</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#111118]">₹499</span>
                <span className="text-sm font-semibold text-[#60608a]">/ package</span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#111118] bg-[#fbdd84]/20 inline-block px-3 py-1.5 rounded-full">
                670 Tokens <span className="mx-1 opacity-40">•</span> ₹1/token
              </p>
            </div>
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#7e63f8] bg-[#7e63f8]/10 rounded-full p-0.5" style={{ fontSize: '18px' }}>check</span>
                  Priority Support
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#7e63f8] bg-[#7e63f8]/10 rounded-full p-0.5" style={{ fontSize: '18px' }}>check</span>
                  30-day validity
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#7e63f8] bg-[#7e63f8]/10 rounded-full p-0.5" style={{ fontSize: '18px' }}>check</span>
                  1 Bonus Skill Test
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#60608a] line-through">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  Exclusive Badge
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPlan('value')}
              className="w-full py-4 rounded-xl bg-[#f0f0f5] text-[#111118] text-sm font-bold hover:bg-[#e2e2eb] transition-all"
            >
              Select Value
            </button>
          </div>

          {/* Pro Card */}
          <div className="bg-white rounded-xl p-8 border-2 border-[#7e63f8] premium-shadow flex flex-col h-full relative hover:translate-y-[-4px] transition-transform duration-300">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-[#7e63f8] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                Most Popular
              </span>
            </div>
            <div className="mb-8">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#7e63f8] mb-4">Pro</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-[#111118]">₹999</span>
                <span className="text-sm font-semibold text-[#60608a]">/ package</span>
              </div>
              <p className="mt-4 text-sm font-bold text-white bg-[#7e63f8] inline-block px-3 py-1.5 rounded-full">
                1500 Tokens <span className="mx-1 opacity-50">•</span> ₹1/token
              </p>
            </div>
            <div className="flex-grow">
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#111118] bg-[#cbec93] rounded-full p-0.5" style={{ fontSize: '18px', fontWeight: 800 }}>check</span>
                  Dedicated Support
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#111118] bg-[#cbec93] rounded-full p-0.5" style={{ fontSize: '18px', fontWeight: 800 }}>check</span>
                  Unlimited validity
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#111118] bg-[#cbec93] rounded-full p-0.5" style={{ fontSize: '18px', fontWeight: 800 }}>check</span>
                  5 Bonus Skill Tests
                </li>
                <li className="flex items-center gap-3 text-sm font-medium text-[#111118]">
                  <span className="material-symbols-outlined text-[#111118] bg-[#cbec93] rounded-full p-0.5" style={{ fontSize: '18px', fontWeight: 800 }}>check</span>
                  Exclusive Badge
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleSelectPlan('pro')}
              className="w-full py-4 rounded-xl bg-[#7e63f8] text-white text-sm font-black hover:opacity-90 shadow-md transition-all"
            >
              Get Pro Now
            </button>
          </div>
        </div>

        {/* Enterprise Features Section */}
        <div className="mt-20 pt-14 border-t border-[#f0f0f5]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-black text-[#111118] mb-4 leading-tight">
                Enterprise-grade security and support
              </h2>
              <p className="text-base text-[#60608a] mb-6 font-medium">
                Designed for high-growth teams requiring precision and reliability. Your data is protected by industry-leading standards.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex gap-3">
                  <div className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-[#7e63f8]/10 text-[#7e63f8]">
                    <span className="material-symbols-outlined">shield_lock</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111118] mb-1">Secure Payments</h4>
                    <p className="text-sm text-[#60608a]">PCI-DSS compliant processing for all transactions.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-[#7e63f8]/10 text-[#7e63f8]">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111118] mb-1">Instant Top-up</h4>
                    <p className="text-sm text-[#60608a]">Tokens are credited instantly after purchase.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-[#7e63f8]/10 text-[#7e63f8]">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111118] mb-1">Usage Analytics</h4>
                    <p className="text-sm text-[#60608a]">Detailed dashboard for token consumption tracking.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="shrink-0 size-10 flex items-center justify-center rounded-xl bg-[#7e63f8]/10 text-[#7e63f8]">
                    <span className="material-symbols-outlined">support_agent</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#111118] mb-1">Dedicated Support</h4>
                    <p className="text-sm text-[#60608a]">Human support available 24/7 for Enterprise users.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#f8f8fb] rounded-xl p-6 relative overflow-hidden h-[340px]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,rgba(126,99,248,0.35)_0%,transparent_70%)]" />
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex gap-2">
                    <div className="size-3 rounded-full bg-[#ff5f56]" />
                    <div className="size-3 rounded-full bg-[#ffbd2e]" />
                    <div className="size-3 rounded-full bg-[#27c93f]" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#60608a]">Dashboard Preview</span>
                </div>
                <div className="bg-white rounded-lg p-5 premium-shadow translate-x-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-9 rounded-full bg-[#7e63f8]/20 flex items-center justify-center text-[#7e63f8]">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance_wallet</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#60608a] uppercase">Token Balance</p>
                      <p className="text-lg font-black text-[#111118]">12,450</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-[#f0f0f5] rounded-full overflow-hidden">
                      <div className="h-full bg-[#7e63f8] w-[75%]" />
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-[#60608a]">
                      <span>Usage this month</span>
                      <span>75%</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-5 premium-shadow -translate-x-4 mt-3">
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-20 bg-[#f0f0f5] rounded-full" />
                      <div className="h-4 w-32 bg-[#f0f0f5] rounded-full" />
                    </div>
                    <div className="size-10 rounded-lg bg-[#cbec93]/20 flex items-center justify-center text-[#cbec93]">
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>verified</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center">
          <div className="flex justify-center gap-6 mb-6 grayscale opacity-50 contrast-125">
            <span className="font-black text-lg text-[#111118]">VISA</span>
            <span className="font-black text-lg text-[#111118]">stripe</span>
            <span className="font-black text-lg text-[#111118]">GPay</span>
            <span className="font-black text-lg text-[#111118]">PayPal</span>
          </div>
          <p className="text-xs font-bold text-[#60608a] uppercase tracking-widest">
            © 2025 THEUNOiA. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default BuyCreditsPage;
