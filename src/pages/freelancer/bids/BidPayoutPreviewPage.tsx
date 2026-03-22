/**
 * BidPayoutPreviewPage
 * Shows complete payout breakdown before freelancer confirms bid
 * Design based on CheckoutPage.tsx
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { PayoutBreakdownCard } from '@/components/financial/PayoutBreakdownCard';
import {
  calculateFreelancerPayout,
  formatINR,
  calculateMilestoneBreakdown,
} from '@/lib/financial';
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import type { PayoutBreakdown, MilestonePayment } from '@/types/financial';
import {
  ArrowLeft,
  Shield,
  Lock,
  Verified,
  Info,
  FileText,
  Calendar,
  Coins,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ProjectData {
  id: string;
  title: string;
  budget: number | null;
  category: string | null;
  bidding_deadline: string | null;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  panNumber: string | null;
  gstinNumber: string | null;
  isGSTRegistered: boolean;
}

// Mock data for testing - Remove in production
const MOCK_USER_PROFILE: UserProfile = {
  firstName: 'Test',
  lastName: 'Freelancer',
  panNumber: 'ABCDE1234F',
  gstinNumber: '27ABCDE1234F1Z5',
  isGSTRegistered: true, // Toggle this to test GST/non-GST scenarios
};

const BidPayoutPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // URL params
  const projectId = searchParams.get('projectId');
  const bidAmountParam = searchParams.get('amount');
  const proposalParam = searchParams.get('proposal');

  // State
  const [project, setProject] = useState<ProjectData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [showMilestones, setShowMilestones] = useState(false);

  // Parsed values
  const bidAmount = bidAmountParam ? parseFloat(bidAmountParam) : 0;
  const proposal = proposalParam || '';

  // Calculate payout breakdown
  const [payoutBreakdown, setPayoutBreakdown] = useState<PayoutBreakdown | null>(null);
  const [milestones, setMilestones] = useState<MilestonePayment[]>([]);

  useEffect(() => {
    if (!projectId || !bidAmountParam) {
      toast({
        title: 'Invalid Request',
        description: 'Missing project or bid information',
        variant: 'destructive',
      });
      navigate('/projects');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, user]);

  useEffect(() => {
    if (profile && bidAmount > 0) {
      // Calculate payout breakdown
      const breakdown = calculateFreelancerPayout({
        contractValue: bidAmount,
        freelancerGSTRegistered: profile.isGSTRegistered,
        // For testing, force TDS applicable if amount > 30000
        forceTDSApplicable: bidAmount > 30000,
      });
      setPayoutBreakdown(breakdown);

      // Calculate milestone breakdown if project has category
      if (project?.category) {
        const phases = getPhasesForCategory(project.category);
        const milestoneData = calculateMilestoneBreakdown({
          contractValue: bidAmount,
          phases,
          freelancerGSTRegistered: profile.isGSTRegistered,
        });
        setMilestones(milestoneData);
      }
    }
  }, [profile, bidAmount, project]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch project
      if (projectId) {
        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .select('id, title, budget, category, bidding_deadline')
          .eq('id', projectId)
          .single();

        if (projectError) throw projectError;
        setProject(projectData);
      }

      // Fetch user profile
      if (user?.id) {
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (profileError) throw profileError;

        // For now, use mock data for financial fields
        // In production, these would come from the database
        setProfile({
          firstName: profileData?.first_name || MOCK_USER_PROFILE.firstName,
          lastName: profileData?.last_name || MOCK_USER_PROFILE.lastName,
          panNumber: MOCK_USER_PROFILE.panNumber,
          gstinNumber: MOCK_USER_PROFILE.gstinNumber,
          isGSTRegistered: MOCK_USER_PROFILE.isGSTRegistered,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBid = async () => {
    if (!user?.id || !projectId || !payoutBreakdown) {
      toast({
        title: 'Error',
        description: 'Missing required information',
        variant: 'destructive',
      });
      return;
    }

    if (!agreementAccepted) {
      toast({
        title: 'Agreement Required',
        description: 'Please accept the terms and deductions to proceed',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      // Check if already bid
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('project_id', projectId)
        .eq('freelancer_id', user.id)
        .maybeSingle();

      if (existingBid) {
        toast({
          title: 'Already Submitted',
          description: 'You have already placed a bid on this project',
          variant: 'destructive',
        });
        navigate(`/projects/${projectId}`);
        return;
      }

      // Submit bid
      const { error } = await supabase
        .from('bids')
        .insert({
          project_id: projectId,
          freelancer_id: user.id,
          amount: bidAmount,
          proposal: proposal,
          status: 'pending',
        });

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }

      toast({
        title: 'Bid Submitted Successfully!',
        description: `10 credits deducted. Your payout will be ${formatINR(payoutBreakdown.netPayout)} after deductions.`,
      });

      // Navigate to bids page
      navigate('/bids');
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit bid. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary-purple border-t-transparent" />
      </div>
    );
  }

  if (!project || !payoutBreakdown) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-6 bg-white">
        <p className="text-slate-500 font-medium">Project not found</p>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="px-5 py-2.5 rounded-lg bg-primary-purple text-white text-sm font-bold hover:opacity-90"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  const freelancerName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '—';

  return (
    <div className="min-h-screen bg-white text-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <main className="flex justify-center py-5 px-4 lg:px-6">
        <div className="w-full max-w-[1100px] flex flex-col gap-4">
          {/* Back Button */}
          <div>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm py-1 px-0 bg-transparent border-0 shadow-none outline-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-1.5 text-white bg-primary-purple px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-widest w-fit shadow-sm">
              <Shield className="w-3 h-3" />
              Payout Preview
            </div>
            <h1 className="text-slate-900 text-2xl font-black tracking-tight">Review Your Payout</h1>
            <p className="text-slate-500 text-sm font-medium">Review deductions and confirm your bid submission</p>
          </div>

          {/* Project Info Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Project</p>
                <h2 className="text-lg font-bold text-slate-900">{project.title}</h2>
                {project.category && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-secondary-yellow/30 text-[#73480d] text-[10px] font-bold rounded">
                    {project.category}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Your Bid</p>
                <p className="text-2xl font-black text-primary-purple">{formatINR(bidAmount)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column: Payout Breakdown + Milestones */}
            <div className="lg:col-span-7 flex flex-col gap-3">
              {/* Payout Breakdown Card */}
              <PayoutBreakdownCard breakdown={payoutBreakdown} showDetails={true} />

              {/* Milestone Breakdown (Collapsible) */}
              {milestones.length > 0 && (
                <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowMilestones(!showMilestones)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-purple" />
                      <span className="text-sm font-bold text-slate-900">Phase-wise Payout ({milestones.length} phases)</span>
                    </div>
                    {showMilestones ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {showMilestones && (
                    <div className="p-4 pt-0 border-t border-slate-100">
                      <div className="space-y-3">
                        {milestones.map((milestone, index) => (
                          <div
                            key={index}
                            className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-900">
                                Phase {index + 1}: {milestone.phaseName}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {milestone.percentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-[11px]">
                              <div>
                                <p className="text-slate-400 font-medium">Amount</p>
                                <p className="font-bold text-slate-700">{formatINR(milestone.amount)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-medium">TDS</p>
                                <p className={`font-bold ${milestone.tdsApplicable ? 'text-red-500' : 'text-slate-400'}`}>
                                  {milestone.tdsApplicable ? `-${formatINR(milestone.tds)}` : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 font-medium">Net Payout</p>
                                <p className="font-bold text-[#145214]">{formatINR(milestone.netPayout)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Billing Information */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
                <h3 className="text-slate-900 text-base font-bold mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-purple" />
                  Your Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">Name</span>
                    <p className="text-slate-800 font-bold text-sm">{freelancerName}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">PAN</span>
                    <p className="text-slate-800 font-bold text-sm">{profile?.panNumber || '—'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">GST Registered</span>
                    <p className="text-slate-800 font-bold text-sm">
                      {profile?.isGSTRegistered ? 'Yes' : 'No'}
                    </p>
                  </div>
                  {profile?.gstinNumber && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em]">GSTIN</span>
                      <p className="text-slate-800 font-bold text-sm">{profile.gstinNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Final Amount + Agreement + Confirm */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Final Payout Amount Card */}
              <div className="bg-accent-green rounded-xl shadow-[0_12px_28px_rgba(203,236,147,0.22)] border border-white/50 p-4 flex flex-col gap-4 relative">
                <div className="absolute -right-8 -top-8 size-32 bg-white/20 rounded-full blur-2xl pointer-events-none" aria-hidden />
                <div className="flex flex-col gap-1.5 relative z-10">
                  <span className="text-[#145214] font-black text-[9px] uppercase tracking-[0.2em]">Your Net Payout</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-3xl font-black text-[#145214] tracking-tighter">
                      ₹{Math.floor(payoutBreakdown.netPayout).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[#145214]/80 font-bold text-base">
                      .{(payoutBreakdown.netPayout % 1).toFixed(2).substring(2)}
                    </span>
                  </div>
                  <p className="text-[#145214]/80 text-xs font-semibold">
                    After all deductions • {formatINR(bidAmount)} contract
                  </p>
                </div>

                {/* Credit Deduction Notice */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-white/50 border border-[#145214]/10">
                  <Coins className="w-4 h-4 text-[#145214]" />
                  <p className="text-[11px] font-bold text-[#145214]">
                    10 credits will be deducted from your balance
                  </p>
                </div>
              </div>

              {/* Agreement Section */}
              <div className="bg-white rounded-xl shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreement"
                    checked={agreementAccepted}
                    onCheckedChange={(checked) => setAgreementAccepted(checked === true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="agreement" className="text-sm font-bold text-slate-900 cursor-pointer">
                      I accept the deductions and terms
                    </label>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      By confirming, you agree to:
                    </p>
                    <ul className="text-[11px] text-slate-500 mt-1 space-y-1">
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary-purple">•</span>
                        Platform fee (5%) and GST deductions
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary-purple">•</span>
                        TCS (1%) deduction and deposit to government
                      </li>
                      {payoutBreakdown.tdsApplicable && (
                        <li className="flex items-start gap-1.5">
                          <span className="text-primary-purple">•</span>
                          TDS (10%) held in FD until Form 16A uploaded
                        </li>
                      )}
                      <li className="flex items-start gap-1.5">
                        <span className="text-primary-purple">•</span>
                        THEUNOiA's{' '}
                        <Link to="/terms-and-conditions" className="text-primary-purple hover:underline">
                          Terms of Service
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                type="button"
                onClick={handleConfirmBid}
                disabled={!agreementAccepted || submitting}
                className="w-full min-h-[48px] h-12 rounded-xl bg-primary-purple hover:bg-[#6b4fe6] active:scale-[0.98] transition-all shadow-lg shadow-primary-purple/30 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-purple disabled:active:scale-100"
              >
                <span>{submitting ? 'Submitting...' : 'Confirm & Submit Bid'}</span>
                {!submitting && <ArrowLeft className="w-4 h-4 rotate-180" />}
              </button>

              {/* Security Features */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-accent-green/40 flex items-center justify-center text-[#145214] shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Transparent Deductions</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">No Hidden Fees</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-secondary-yellow/40 flex items-center justify-center text-[#73480d] shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">TDS Protected in FD</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Secure Holding</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-primary-purple shrink-0">
                      <Verified className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col gap-0 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight">Tax Compliant</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">GST, TDS, TCS</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Accordion */}
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-slate-400" />
                      <p className="text-slate-700 text-xs font-black uppercase tracking-wider">About Deductions</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <div className="p-4 pt-0 border-t border-slate-50">
                    <ul className="space-y-2.5">
                      <li className="flex items-start gap-2">
                        <span className="flex-none px-1.5 py-0.5 rounded bg-primary-purple/10 text-primary-purple text-[9px] font-black uppercase mt-0.5">TCS</span>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                          Tax Collected at Source (1%) is deposited to the government. You can claim credit when filing ITR.
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-none px-1.5 py-0.5 rounded bg-secondary-yellow/30 text-[#73480d] text-[9px] font-black uppercase mt-0.5">TDS</span>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                          Tax Deducted at Source (10%) is held in Fixed Deposit. Released to you if client doesn't upload Form 16A.
                        </p>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="flex-none px-1.5 py-0.5 rounded bg-accent-green/30 text-[#145214] text-[9px] font-black uppercase mt-0.5">GST</span>
                        <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                          If you're GST registered, 18% GST is collected from client. You must file GST returns.
                        </p>
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
              <Link to="/terms-and-conditions" className="hover:text-primary-purple transition-colors">Terms</Link>
              <span className="size-1 rounded-full bg-slate-300" />
              <Link to="/terms-and-conditions" className="hover:text-primary-purple transition-colors">Privacy</Link>
              <span className="size-1 rounded-full bg-slate-300" />
              <Link to="/contact" className="hover:text-primary-purple transition-colors">Support</Link>
            </div>
            <p className="text-slate-400/80 text-[11px] max-w-lg leading-relaxed font-medium">
              By submitting this bid, you agree to THEUNOiA's{' '}
              <Link to="/terms-and-conditions" className="underline hover:text-primary-purple transition-colors">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/terms-and-conditions" className="underline hover:text-primary-purple transition-colors">Freelancer Agreement</Link>.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default BidPayoutPreviewPage;
