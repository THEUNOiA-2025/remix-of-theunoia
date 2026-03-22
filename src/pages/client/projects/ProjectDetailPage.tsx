import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArrowLeft, Clock, MapPin, IndianRupee,
  FileText, CheckCircle2, MapPin as LocationIcon, Calendar,
  Star, Paperclip, Download, MessageSquare, User, Eye
} from "lucide-react";
import { ClientProjectTrackingBoard } from "@/pages/client/projects/ProjectTracking/ClientProjectTrackingBoard";
import { getPhasesForCategory } from "@/pages/shared/projects/ProjectTracking/phaseMapping";
import { getPhasePaymentStatus } from "@/pages/shared/projects/ProjectTracking/phaseLockingLogic";
import { ProjectTrackingService } from "@/services/ProjectTrackingService";
import { ProjectCompletionRejectionDialog } from "@/pages/freelancer/projects/ProjectTracking/ProjectCompletionRejectionDialog";
import { PROJECT_VIDEOS } from "@/utils/randomVideo";
import { useRazorpay } from "react-razorpay";
import { PhaseState } from "@/pages/shared/projects/ProjectTracking/phaseLockingTypes";
import { Task } from "@/pages/shared/projects/ProjectTracking/types";

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  cover_image_url: string | null;
  additional_images: string[] | null;
  attached_files: AttachedFile[] | null;
  project_type: 'work_requirement' | 'portfolio_project' | 'client_project';
  budget: number | null;
  timeline: string | null;
  skills_required: string[] | null;
  status: string | null;
  created_at: string;
  bidding_deadline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface AttachedFile {
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface Bid {
  id: string;
  freelancer_id: string;
  project_id: string;
  amount: number;
  proposal: string;
  status: string;
  created_at: string;
  freelancer?: {
    first_name: string | null;
    last_name: string | null;
    profile_picture_url: string | null;
  } | null;
}

// Type for RPC response (function not in generated types yet)
interface RpcBidResponse {
  id: string;
  project_id: string;
  freelancer_id: string;
  amount: number;
  proposal: string;
  status: string;
  created_at: string;
  updated_at: string;
  freelancer_first_name: string | null;
  freelancer_last_name: string | null;
  freelancer_profile_picture_url: string | null;
}

const ClientProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
  const [expandedBidId, setExpandedBidId] = useState<string | null>(null);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const { Razorpay } = useRazorpay();

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchBids();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const fetchProjectDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProject(data as any);

      // Also fetch phases and tasks if project is in progress
      if (data.status === 'in_progress' || data.status === 'completed') {
        const [states, projectTasks] = await Promise.all([
          ProjectTrackingService.getPhaseStates(id),
          ProjectTrackingService.getTasks(id)
        ]);
        setPhaseStates(states);
        setTasks(projectTasks);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      toast.error("Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    if (!id) return;

    try {
      // Fetch bids without profiles
      const { data: bidsData, error: bidsError } = await supabase
        .from("bids")
        .select("*")
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (bidsError) throw bidsError;

      const bidsWithoutProfiles = (bidsData || []).map(bid => ({
        ...bid,
        freelancer: null
      }));

      setBids(bidsWithoutProfiles);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    try {
      const selectedBid = bids.find(b => b.id === bidId);
      if (!selectedBid) {
        toast.error("Bid not found");
        return;
      }

      // 1. Calculate the required advance payment amount
      const phases = getPhasesForCategory(project?.category || null);
      const totalPhases = phases.length;
      const onePhaseAmount = selectedBid.amount / totalPhases;

      // Workflow: 1 phase advance if phases <= 4, otherwise 2 phases advance
      const advancePhases = totalPhases <= 4 ? 1 : 2;
      const advanceAmount = onePhaseAmount * advancePhases;

      toast.loading(`Preparing secure checkout for ₹${advanceAmount.toLocaleString()} advance...`, { id: "payment-checkout" });

      // 2. Create Razorpay Order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          projectId: project.id,
          amount: advanceAmount,
          bidId: bidId,
          paymentType: 'advance'
        }
      });

      if (orderError) {
        toast.dismiss("payment-checkout");
        throw new Error(orderError.message || "Failed to initialize payment gateway");
      }

      if (!orderData?.id) {
        toast.dismiss("payment-checkout");
        throw new Error("Failed to retrieve order ID from gateway");
      }

      toast.dismiss("payment-checkout");

      // 3. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "The Unoia",
        description: `Advance Payment for ${project?.title}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            toast.loading("Verifying payment...", { id: "verify-payment" });

            // 4. Verify Payment and trigger Bid Acceptance
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                projectId: project.id,
                bidId: bidId,
                paymentType: 'advance',
                phaseNames: getPhasesForCategory(project.category)
              }
            });

            if (verifyError || !verifyData?.success) {
              throw new Error("Payment verification failed");
            }

            toast.dismiss("verify-payment");
            toast.success("Advance Payment Received! Project is now In Progress. 🎉");

            fetchProjectDetails();
            fetchBids();
          } catch (verifyErr: any) {
            toast.dismiss("verify-payment");
            console.error("Verification error:", verifyErr);
            toast.error("Payment received but verification failed. Please contact support.");
          }
        },
        prefill: {
          name: user?.user_metadata?.first_name || "Client",
          email: user?.email || "",
        },
        theme: {
          color: "#7E63F8",
        },
      };

      const rzpay = new (window as any).Razorpay(options);

      rzpay.on("payment.failed", function (response: any) {
        console.error("Payment Failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });

      rzpay.open();
    } catch (error: any) {
      toast.dismiss("payment-checkout");
      console.error("Error accepting bid:", error);
      toast.error(error.message || "Failed to accept bid");
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const { error } = await supabase
        .from("bids")
        .update({ status: "rejected" })
        .eq("id", bidId);

      if (error) throw error;

      toast.success("Bid rejected");
      fetchBids();
    } catch (error) {
      console.error("Error rejecting bid:", error);
      toast.error("Failed to reject bid");
    }
  };

  const handlePayPhase = async (phaseId: string, amount: number) => {
    try {
      if (!id || !project) return;

      toast.loading(`Preparing secure checkout for ₹${amount.toLocaleString()}...`, { id: "phase-checkout" });

      // 1. Create Razorpay Order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: {
          projectId: id,
          amount: amount,
          phaseId: phaseId,
          paymentType: 'phase'
        }
      });

      if (orderError) {
        toast.dismiss("phase-checkout");
        throw new Error(orderError.message || "Failed to initialize payment gateway");
      }

      toast.dismiss("phase-checkout");

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "The Unoia",
        description: `Phase Payment for ${project.title}`,
        order_id: orderData.id,
        handler: async (response: any) => {
          try {
            toast.loading("Verifying phase payment...", { id: "verify-phase-payment" });

            // 3. Verify Payment
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                projectId: id,
                phaseId: phaseId,
                paymentType: 'phase'
              }
            });

            if (verifyError || !verifyData?.success) {
              throw new Error("Payment verification failed");
            }

            toast.dismiss("verify-phase-payment");
            toast.success("Phase Payment Received! 🎉");

            fetchProjectDetails();
          } catch (verifyErr: any) {
            toast.dismiss("verify-phase-payment");
            console.error("Verification error:", verifyErr);
            toast.error("Payment received but verification failed.");
          }
        },
        prefill: {
          name: user?.user_metadata?.first_name || "Client",
          email: user?.email || "",
        },
        theme: {
          color: "#7E63F8",
        },
      };

      const rzpay = new (window as any).Razorpay(options);
      rzpay.open();
    } catch (error: any) {
      console.error("Pay phase error:", error);
      toast.error(error.message || "Failed to initiate payment");
    }
  };

  const isProjectOpen = project?.status === 'open';

  // Determine if bidding is closed
  // Bidding is closed if:
  // 1. A bid has been accepted (project status is 'in_progress' or 'completed')
  // 2. The bidding deadline has passed
  const isBiddingClosed = (() => {
    if (!project) return false;

    // Check if a bid has been accepted (project moved to in_progress or completed)
    if (project.status === 'in_progress' || project.status === 'completed') {
      return true;
    }

    // Check if any bid is accepted
    const hasAcceptedBid = bids.some(bid => bid.status === 'accepted');
    if (hasAcceptedBid) {
      return true;
    }

    // Check if bidding deadline has passed
    if (project.bidding_deadline) {
      const deadline = new Date(project.bidding_deadline);
      const now = new Date();
      if (deadline < now) {
        return true;
      }
    }

    return false;
  })();

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-11 py-10">
          <div className="text-center py-10">
            <p className="text-slate-500 text-sm">Loading project details...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-11 py-10">
          <div className="text-center py-10">
            <h3 className="text-base font-semibold text-slate-900 mb-1.5">Project Not Found</h3>
            <p className="text-slate-500 mb-5 text-sm">The project you're looking for doesn't exist</p>
            <Button onClick={() => navigate('/projects')} className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Projects
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(project.created_at), { addSuffix: true });

  return (() => {
    const acceptedBid = bids.find(b => b.status === "accepted");
    const effectiveBudget = acceptedBid ? acceptedBid.amount : (project?.budget || 0);

    return (
      <main className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 lg:px-7 py-7">
          {/* Breadcrumb */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-primary-purple transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Project
            </button>
          </div>

          {/* Project Header - Only show in Overview tab */}
          {activeTab === 'overview' && (
            <div className="mb-7">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4.5">
                <div className="flex-1 max-w-3xl">
                  <div className="flex gap-1.5 mb-3.5">
                    {/* Project Status Badge */}
                    {(() => {
                      const status = project.status;
                      let badgeClass = "bg-accent-green text-[#052005]";
                      let dotClass = "bg-[#145214]";
                      let label = "Active Project";

                      if (status === 'in_progress') {
                        label = "In Progress";
                      } else if (status === 'completion_requested') {
                        badgeClass = "bg-amber-100 text-amber-900 border border-amber-200";
                        dotClass = "bg-amber-500";
                        label = "Completion Requested";
                      } else if (status === 'completed') {
                        label = "Completed";
                      } else if (status === 'open') {
                        label = "Open for Bids";
                      }

                      return (
                        <span className={`px-2 py-0.5 ${badgeClass} text-[9px] font-bold rounded-full flex items-center gap-1`}>
                          <span className={`size-1.5 rounded-full ${dotClass}`}></span> {label}
                        </span>
                      );
                    })()}
                    {/* Bidding Status Badge */}
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full flex items-center gap-1 ${isBiddingClosed
                      ? 'bg-red-100 text-red-700'
                      : 'bg-secondary-yellow text-[#73480d]'
                      }`}>
                      <span className={`size-1.5 rounded-full ${isBiddingClosed ? 'bg-red-500' : 'bg-[#73480d]'}`}></span>
                      {isBiddingClosed ? 'Closed for Bidding' : 'Open for Bidding'}
                    </span>
                    {project.category && (
                      <span className="px-2.5 py-0.5 bg-secondary-yellow text-[#73480d] text-[9px] font-extrabold uppercase tracking-widest rounded-full">
                        {project.category}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 leading-[1.15] mb-3.5">
                    {project.title}
                  </h1>
                  <p className="text-slate-900 font-bold flex flex-wrap items-center gap-3.5 text-xs">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-purple" />
                      Posted {timeAgo}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-primary-purple" />
                      Remote / Global
                    </span>
                  </p>
                </div>
                {/* Action Buttons - Right Side (NO Add Collaborator button) */}
                <div className="flex flex-row gap-2 items-center">
                  <button
                    onClick={() => navigate(`/messages?project=${project.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Client Approval Banner */}
          {project.status === 'completion_requested' && (
            <div className="mb-7 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white rounded-full shadow-sm text-amber-500">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">Project Completion Requested</h3>
                  <p className="text-sm text-slate-600 mb-2">The freelancer has marked this project as complete.</p>
                  {/* Show submission message if available - simplified for now */}
                  {(project as any).completion_data && (
                    <div className="bg-white/50 p-3 rounded-lg text-sm text-slate-800 italic border border-amber-100/50">
                      "{(project as any).completion_data.message}"
                    </div>
                  )}
                  {(project as any).completion_data?.attachments?.length > 0 && (
                    <div className="mt-2 text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Paperclip className="w-3 h-3" />
                      {(project as any).completion_data.attachments.length} Attachment(s)
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-none border-amber-200 hover:bg-amber-100 text-amber-800"
                  onClick={() => setRejectionDialogOpen(true)}
                >
                  Reject
                </Button>
                <Button
                  className="flex-1 sm:flex-none bg-accent-green text-[#052005] hover:bg-accent-green/90"
                  onClick={async () => {
                    try {
                      if (!project.id) return;

                      toast.loading("Approving project completion...", { id: "approve-completion" });

                      await ProjectTrackingService.approveProjectCompletion(project.id);

                      toast.dismiss("approve-completion");
                      toast.success("Project marked as completed! 🎉");

                      fetchProjectDetails();
                    } catch (e: any) {
                      toast.dismiss("approve-completion");
                      console.error("Approve error:", e);
                      toast.error(e.message || "Failed to approve project completion.");
                    }
                  }}
                >
                  Approve Completion
                </Button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-7 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            <div className="inline-flex p-1 bg-slate-50 border border-slate-100 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-5 py-2 text-[11px] font-bold tracking-wide transition-all rounded-lg ${activeTab === 'overview'
                  ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/20'
                  : 'text-slate-900 hover:text-slate-700 bg-transparent'
                  }`}
              >
                Project Overview
              </button>
              <button
                onClick={() => setActiveTab('tracking')}
                className={`px-5 py-2 text-[11px] font-bold tracking-wide transition-all rounded-lg ${activeTab === 'tracking'
                  ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/20'
                  : 'text-slate-900 hover:text-slate-700 bg-transparent'
                  }`}
              >
                Project Tracking
              </button>
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'tracking' ? (
            <ClientProjectTrackingBoard
              projectId={project?.id || ''}
              projectCategory={project?.category || null}
              onTaskUpdate={fetchProjectDetails}
              projectBudget={effectiveBudget}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 flex flex-col gap-7">
                {/* Project Visual */}
                <div className="flex flex-col gap-5">
                  <div className="relative w-full max-w-[90%] aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 group">
                    <video
                      src={encodeURI(PROJECT_VIDEOS[project.id.charCodeAt(0) % PROJECT_VIDEOS.length])}
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ objectFit: 'cover', objectPosition: 'center center', transform: 'scale(1.2)' }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60"></div>
                  </div>

                  {/* Project Summary */}
                  <div className="grid grid-cols-3 gap-5 p-5 bg-secondary border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">Estimated Budget</span>
                      <span className="text-lg font-bold text-black">
                        {project.budget ? `₹${project.budget.toLocaleString()}` : 'Negotiable'}
                      </span>
                    </div>
                    <div className="flex flex-col border-x border-slate-100 px-5">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">Target Deadline</span>
                      <span className="text-lg font-bold text-black">
                        {project.bidding_deadline ? format(new Date(project.bidding_deadline), "d MMM yyyy") : project.timeline || 'Flexible'}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">Bids Received</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-black">{bids.length} Bids</span>
                        <span className="flex h-2 w-2 rounded-full bg-accent-green animate-pulse"></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Brief */}
                <section className="space-y-7">
                  <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed text-xs">
                    <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2.5">
                      <span className="w-1.5 h-5 bg-secondary-yellow rounded-full"></span>
                      Project Brief
                    </h2>
                    <div className="whitespace-pre-wrap">{project.description}</div>
                  </div>

                  {/* Skills and Category */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-7 pt-5 border-t border-slate-300">
                    {project.skills_required && project.skills_required.length > 0 && (
                      <div>
                        <h3 className="text-[11px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-3.5">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.skills_required.map((skill, index) => {
                            const colors = [
                              'bg-primary-purple/10 text-primary-purple border-primary-purple/5',
                              'bg-secondary-yellow/20 text-yellow-800 border-secondary-yellow/10',
                              'bg-accent-green/20 text-emerald-800 border-accent-green/10',
                            ];
                            const colorClass = colors[index % colors.length];
                            return (
                              <span
                                key={index}
                                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold border ${colorClass}`}
                              >
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {(project.category || project.subcategory) && (
                      <div>
                        <h3 className="text-[11px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-3.5">Category & Subcategory</h3>
                        <div className="flex items-center gap-2">
                          {project.category && (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-purple/5 border border-primary-purple/10 hover:border-primary-purple/20 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-purple shadow-[0_0_6px_rgba(126,99,248,0.5)]"></span>
                              <span className="text-[11px] font-bold text-primary-purple tracking-tight">{project.category}</span>
                            </div>
                          )}
                          {project.subcategory && (
                            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary-yellow/10 border border-secondary-yellow/20 hover:border-secondary-yellow/30 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary-yellow shadow-[0_0_6px_rgba(251,221,132,0.5)]"></span>
                              <span className="text-[11px] font-bold text-[#73480d] tracking-tight">{project.subcategory}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Shared Resources */}
                  {project.attached_files && project.attached_files.length > 0 && (
                    <div className="pt-5 border-t border-slate-300">
                      <h2 className="text-base font-bold mb-4 text-slate-900">Shared Resources</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {project.attached_files.map((file: AttachedFile, index: number) => {
                          const isPdf = file.name?.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
                          const isDoc = file.name?.toLowerCase().endsWith('.docx') || file.name?.toLowerCase().endsWith('.doc') || file.type?.includes('word');

                          const handleDownload = (e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = file.url;
                            link.download = file.name || 'download';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          };

                          return (
                            <div
                              key={index}
                              className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3.5 group cursor-pointer hover:border-primary-purple/30 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-100/50"
                            >
                              <div className={`w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center border border-slate-100 ${isPdf ? 'text-red-500' : 'text-blue-500'}`}>
                                {isPdf ? <FileText className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-slate-800 text-xs">{file.name || 'Untitled File'}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                  {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'} • {isPdf ? 'PDF' : isDoc ? 'DOCX' : 'FILE'}
                                </p>
                              </div>
                              <button
                                onClick={handleDownload}
                                className="p-1.5 rounded-lg bg-primary-purple text-white hover:bg-primary-purple/90 transition-colors flex items-center justify-center"
                                title="Download file"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Separator then Project payments (Overview tab) */}
                  <div className="pt-5 border-t border-slate-300" />
                  <div className="space-y-3">
                    <h2 className="text-base font-bold text-slate-900">Project payments</h2>
                    {(() => {
                      const phases = getPhasesForCategory(project?.category || null);
                      const paymentStatusForPhase = (idx: number) => getPhasePaymentStatus(idx, phaseStates, tasks, phases);
                      const remaining = phases.filter((_, i) => paymentStatusForPhase(i) !== 'done').length;
                      return (
                        <>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {phases.map((phase, index) => {
                              const paymentStatus = paymentStatusForPhase(index);
                              const paymentLabel = paymentStatus === 'done' ? 'Done' : paymentStatus === 'pending' ? 'Pending' : 'Not yet started';
                              const paymentClass = paymentStatus === 'done' ? 'text-green-700' : paymentStatus === 'pending' ? 'text-amber-700' : 'text-slate-500';
                              return (
                                <span key={phase} className={`text-xs font-medium ${paymentClass}`}>
                                  Phase {index + 1}: {paymentLabel}
                                </span>
                              );
                            })}
                          </div>
                          <p className="text-xs font-bold text-slate-700">
                            Payment remaining: {remaining} out of {phases.length}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </section>
              </div>

              {/* Sidebar - BIDS RECEIVED (instead of About the Client) */}
              <div className="lg:col-span-5 space-y-7">
                <div className="sticky top-24 space-y-5">
                  {/* Bids Received Section */}
                  <div className="bg-accent-green rounded-xl p-4 border border-slate-100 shadow-lg shadow-slate-100/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-[10px] font-extrabold uppercase text-slate-900 tracking-[0.15em] flex items-center gap-1.5">
                        <User className="w-4 h-4 text-primary-purple" />
                        Bids Received
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 rounded-full bg-primary-purple/10 text-primary-purple text-xs font-bold">
                          {bids.length} bid{bids.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => {/* TODO: Open bids comparison */ }}
                          className="h-7 px-3 text-[10px] font-bold bg-secondary-yellow hover:bg-secondary-yellow/90 text-slate-900 rounded-lg shadow-sm hover:shadow-md transition-all"
                        >
                          Bids Comparison
                        </button>
                      </div>
                    </div>

                    {bids.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                          <IndianRupee className="w-5 h-5 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">No bids yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">Freelancers will start bidding soon</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {bids.map((bid) => (
                          <div
                            key={bid.id}
                            className={`bg-white rounded-lg p-3 border transition-all ${bid.status === 'accepted'
                              ? 'border-green-300 bg-green-50/50'
                              : bid.status === 'rejected'
                                ? 'border-red-200 bg-red-50/30 opacity-60'
                                : 'border-slate-200 hover:border-primary-purple/20'
                              }`}
                          >
                            {/* Bid Header */}
                            <div className="flex items-center gap-2.5 mb-2">
                              <div className="w-8 h-8 rounded-lg overflow-hidden bg-primary-purple flex items-center justify-center text-white font-bold text-xs shrink-0">
                                {bid.freelancer?.profile_picture_url ? (
                                  <img src={bid.freelancer.profile_picture_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white">
                                    {bid.freelancer?.first_name?.[0] || 'F'}
                                    {bid.freelancer?.last_name?.[0] || 'L'}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 text-xs leading-tight">
                                  {bid.freelancer?.first_name && bid.freelancer?.last_name
                                    ? `${bid.freelancer.first_name} ${bid.freelancer.last_name}`
                                    : bid.freelancer?.first_name || bid.freelancer?.last_name || 'Unknown Freelancer'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-primary-purple">₹{bid.amount.toLocaleString()}</p>
                                {bid.status !== 'pending' && (
                                  <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded inline-block ${bid.status === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {bid.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bid Proposal - Single line with expand */}
                            <p className={`text-[11px] text-slate-500 leading-relaxed mb-2 ${expandedBidId === bid.id ? '' : 'line-clamp-1'
                              }`}>
                              {bid.proposal}
                            </p>

                            {/* Action Buttons - 3 equal buttons filling entire row */}
                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                              {/* View Portfolio - Yellow */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/freelancer/${bid.freelancer_id}`)}
                                className="h-7 text-[10px] font-semibold bg-secondary-yellow hover:bg-secondary-yellow/80 text-slate-800 border-secondary-yellow"
                              >
                                View Portfolio
                              </Button>

                              {/* Accept - Green */}
                              <Button
                                size="sm"
                                onClick={() => bid.status === 'pending' && !isBiddingClosed && handleAcceptBid(bid.id)}
                                disabled={bid.status !== 'pending' || isBiddingClosed}
                                className="h-7 text-[10px] font-semibold bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Accept
                              </Button>

                              {/* Reject - Red outline */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => bid.status === 'pending' && !isBiddingClosed && handleRejectBid(bid.id)}
                                disabled={bid.status !== 'pending' || isBiddingClosed}
                                className="h-7 text-[10px] font-semibold border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <ProjectCompletionRejectionDialog
          open={rejectionDialogOpen}
          onOpenChange={setRejectionDialogOpen}
          projectId={project?.id || ''}
          onSuccess={() => {
            fetchProjectDetails();
          }}
        />
      </main>
    );
  })();
};

export default ClientProjectDetailPage;
