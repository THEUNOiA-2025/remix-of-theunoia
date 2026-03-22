import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsFreelancer } from '@/hooks/useIsFreelancer';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  city?: string;
  pinCode?: string;
}

const creditPlans: Record<string, { name: string; tokens: number; price: number }> = {
  starter: { name: 'Starter', tokens: 100, price: 99 },
  value: { name: 'Value', tokens: 670, price: 499 },
  pro: { name: 'Pro', tokens: 1500, price: 999 },
};

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFreelancer, isLoading: isRoleLoading } = useIsFreelancer();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  const planId = searchParams.get('plan');
  const plan = planId ? creditPlans[planId] : null;

  useEffect(() => {
    if (isRoleLoading) return;
    if (!isFreelancer) {
      navigate('/dashboard', { replace: true });
    }
  }, [isFreelancer, isRoleLoading, navigate]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email, city, pin_code')
        .eq('user_id', user.id)
        .single();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      const row = data;
      if (row) {
        setProfile({
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email,
          city: row.city || '',
          pinCode: row.pin_code || '',
        });
      }
      setProfileLoading(false);
    };

    fetchProfile();
  }, [user, navigate]);

  if (isRoleLoading || !isFreelancer) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#7e63f8] border-t-transparent" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 bg-white">
        <p className="text-slate-500 font-medium">Invalid plan selected</p>
        <button
          type="button"
          onClick={() => navigate('/buy-credits')}
          className="px-5 py-2.5 rounded-lg bg-[#7e63f8] text-white text-sm font-bold hover:opacity-90"
        >
          Back to Plans
        </button>
      </div>
    );
  }

  const basePrice = plan.price;
  const platformFee = Math.round(basePrice * 0.015 * 100) / 100; // 1.5% to match reference
  const taxableAmount = basePrice + platformFee;
  const gst = Math.round(taxableAmount * 0.18 * 100) / 100;
  const totalPayable = Math.round((taxableAmount + gst) * 100) / 100;

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    toast({
      title: 'Coming Soon!',
      description: 'Payment gateway integration is being set up. Stay tuned!',
    });
    setIsLoading(false);
  };

  const clientName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '—';
  const billingAddress = profile
    ? [profile.city, profile.pinCode].filter(Boolean).length
      ? `${profile.city || ''}${profile.city && profile.pinCode ? ', ' : ''}${profile.pinCode || ''}, India`
      : '—'
    : '—';

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <main className="flex justify-center py-5 px-4 lg:px-6">
        <div className="w-full max-w-[1100px] flex flex-col gap-4">
          {/* Back - visible at top, no hover background */}
          <div>
            <button
              type="button"
              onClick={() => navigate('/buy-credits')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm py-1 px-0 bg-transparent border-0 shadow-none outline-none focus:ring-0 focus-visible:ring-0 hover:bg-transparent active:bg-transparent"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
          </div>

          {/* Header block */}
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 text-white bg-[#7e63f8] px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-widest w-fit shadow-sm">
              <span className="material-symbols-outlined text-[10px] font-bold">shield</span>
              Secure Payment
            </div>
            <h1 className="text-slate-900 text-2xl font-black tracking-tight">Payment Summary</h1>
            <p className="text-slate-500 text-sm font-medium">Review details before proceeding to Razorpay</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left column: Transaction + Billing */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Transaction Breakdown */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
                <h3 className="text-slate-900 text-base font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7e63f8] text-lg">receipt_long</span>
                  Transaction Breakdown
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-semibold text-sm">Base Price ({plan.name} Plan)</span>
                    <span className="font-bold text-slate-900 text-sm">₹{basePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-500 font-semibold text-sm">Platform Commission (1.5%)</span>
                    <span className="font-bold text-slate-900 text-sm">₹{platformFee.toFixed(2)}</span>
                  </div>
                  <div className="h-px bg-slate-100 w-full my-1" />
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Taxable Amount</span>
                    <span className="font-bold text-slate-900 text-sm">₹{taxableAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-0.5">
                    <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">GST (18%)</span>
                    <span className="font-bold text-slate-900 text-sm">₹{gst.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 bg-[#cbec93] rounded-lg p-4 flex justify-between items-center shadow-inner">
                    <span className="text-[#145214] font-black text-xs uppercase tracking-widest">Total Payable</span>
                    <span className="text-xl font-black text-[#145214] tracking-tight">₹{totalPayable.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Billing Information */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
                <h3 className="text-slate-900 text-base font-bold mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7e63f8] text-lg">contact_mail</span>
                  Billing Information
                </h3>
                {profileLoading ? (
                  <p className="text-slate-500 text-xs">Loading...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Client Name</span>
                      <p className="text-slate-800 font-bold text-sm">{clientName}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Tax Identifier</span>
                      <p className="text-slate-800 font-bold text-sm">—</p>
                    </div>
                    <div className="flex flex-col gap-1 md:col-span-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Billing Address</span>
                      <p className="text-slate-600 font-medium text-xs leading-relaxed">{billingAddress}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Final amount, Continue button, Security, Policy */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Final Payment Amount card - secondary colour */}
              <div className="bg-[#fbdd84] rounded-xl shadow-[0_12px_28px_rgba(251,221,132,0.22)] border border-white/50 p-4 flex flex-col gap-4 relative">
                <div className="absolute -right-8 -top-8 size-32 bg-white/20 rounded-full blur-2xl pointer-events-none" aria-hidden />
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[#73480d] font-black text-[9px] uppercase tracking-[0.2em]">Final Payment Amount</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-[#73480d] tracking-tighter">₹{Math.floor(totalPayable)}</span>
                    <span className="text-[#73480d]/80 font-bold text-base">.{(totalPayable % 1).toFixed(2).substring(2)}</span>
                  </div>
                  <p className="text-[#73480d]/80 text-xs font-semibold">{plan.name} Plan • {plan.tokens} Tokens</p>
                </div>
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isLoading}
                  className="w-full min-h-[48px] h-12 rounded-lg bg-[#7e63f8] hover:bg-[#6b4fe6] active:scale-[0.98] transition-all shadow-lg shadow-[#7e63f8]/30 text-white font-black text-sm flex items-center justify-center gap-2 group relative z-20 border-2 border-[#7e63f8] hover:border-[#6b4fe6]"
                >
                  <span>{isLoading ? 'Processing...' : 'Continue to Razorpay'}</span>
                  <span className="material-symbols-outlined text-lg font-bold group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                </button>
              </div>

              {/* Security features card */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-[#cbec93]/40 flex items-center justify-center text-[#145214] shrink-0">
                      <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Razorpay Secure</p>
                      <span className="text-[9px] text-[#145214] bg-[#cbec93] px-2 py-0.5 rounded font-black uppercase tracking-wider w-fit">Secure Payment</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-[#fbdd84]/40 flex items-center justify-center text-[#73480d] shrink-0">
                      <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
                    </div>
                    <div className="flex flex-col gap-0 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Encrypted Checkout</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">256-Bit SSL Security</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-[#7e63f8] shrink-0">
                      <span className="material-symbols-outlined text-lg font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    </div>
                    <div className="flex flex-col gap-0 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Instant Confirmation</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Digital Receipt Issued</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details & Policy accordion */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <details className="group" open>
                  <summary className="flex cursor-pointer items-center justify-between p-4 list-none border-b border-transparent group-open:border-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400 text-base">info</span>
                      <p className="text-slate-700 text-xs font-black uppercase tracking-wider">Payment Details & Policy</p>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-lg group-open:rotate-180 transition-transform">expand_more</span>
                  </summary>
                  <div className="p-4">
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-none px-1.5 py-0.5 rounded bg-[#fbdd84] text-[#73480d] text-[9px] font-black uppercase tracking-tighter mt-0.5">REFUND</span>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic">Refunds are processed to the original payment method within 5-7 business days.</p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-none px-1.5 py-0.5 rounded bg-[#fbdd84] text-[#73480d] text-[9px] font-black uppercase tracking-tighter mt-0.5">FEES</span>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed italic">Platform commission is a service fee and is non-refundable.</p>
                      </li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-4 border-t border-slate-100 pt-6 pb-8 text-center flex flex-col items-center gap-4">
            <div className="flex items-center gap-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
              <Link to="/terms-and-conditions" className="hover:text-[#7e63f8] transition-colors">Terms</Link>
              <span className="size-1 rounded-full bg-slate-300" />
              <Link to="/terms-and-conditions" className="hover:text-[#7e63f8] transition-colors">Privacy</Link>
              <span className="size-1 rounded-full bg-slate-300" />
              <Link to="/contact" className="hover:text-[#7e63f8] transition-colors">Support</Link>
            </div>
            <p className="text-slate-400/80 text-[11px] max-w-lg leading-relaxed font-medium">
              By proceeding, you agree to THEUNOiA&apos;s{' '}
              <Link to="/terms-and-conditions" className="underline hover:text-[#7e63f8] transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/terms-and-conditions" className="underline hover:text-[#7e63f8] transition-colors">Refund Policy</Link>.
              You will be redirected to Razorpay&apos;s secure portal.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default CheckoutPage;
