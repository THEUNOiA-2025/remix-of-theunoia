import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { AgreementDialog } from "@/components/AgreementDialog";
import { FinancialProfileRequiredDialog } from "@/components/financial";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { z } from "zod";
import {
  ArrowLeft, Clock, MapPin, UserPlus, IndianRupee,
  FileText, CheckCircle2, MapPin as LocationIcon, Calendar,
  Star, Coins, AlertTriangle, FileText as DocIcon,
  Paperclip, Download, MessageSquare, Check, X, Upload
} from "lucide-react";
import { TOKEN_REFUND_POLICY } from "@/lib/credits/tokenRefundPolicy";
import { recordActivity } from "@/utils/dailyStreak";
import { CollaborationDialog } from "./collaboration/CollaborationDialog";
import { ProjectTrackingBoard } from "./ProjectTracking/ProjectTrackingBoard";
import { getPhasesForCategory } from "@/pages/shared/projects/ProjectTracking/phaseMapping";
import { getPhasePaymentStatus } from "@/pages/shared/projects/ProjectTracking/phaseLockingLogic";
import { PhaseState } from "@/pages/shared/projects/ProjectTracking/phaseLockingTypes";
import { Task } from "@/pages/shared/projects/ProjectTracking/types";
import { BidService } from "@/services/bidService";
import { ProjectTrackingService } from "@/services/ProjectTrackingService";
import { PROJECT_VIDEOS } from "@/utils/randomVideo";
import { ProjectCompletionDialog } from "./ProjectTracking/ProjectCompletionDialog";
import { ProjectCompletionRejectionDialog } from "./ProjectTracking/ProjectCompletionRejectionDialog";
import { PaymentService } from "@/services/PaymentService";

declare global {
  interface Window {
    Razorpay: any;
  }
}


interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  cover_image_url: string | null;
  additional_images: string[] | null;
  attached_files: AttachedFile[] | null;
  project_type: 'work_requirement' | 'portfolio_project';
  budget: number | null;
  timeline: string | null;
  skills_required: string[] | null;
  status: string | null;
  created_at: string;
  bidding_deadline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface ClientProfile {
  first_name: string;
  last_name: string;
  profile_picture_url: string | null;
  city: string | null;
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
}

const bidSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a positive number"),
  proposal: z.string().trim().min(20, "Proposal must be at least 20 characters").max(3000, "Proposal must be less than 3000 characters"),
});

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [leadProfile, setLeadProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPhaseStates = async () => {
    if (!id) return;
    try {
      const states = await ProjectTrackingService.getPhaseStates(id);
      setPhaseStates(states || []);
    } catch (error) {
      console.error("Error fetching phase states:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchBids();
    }
    // ... rest of useEffect
  }, [id]);

  // Helper to check if all phases are completed
  const areAllPhasesCompleted = () => {
    if (!project?.category) return false;
    const phases = getPhasesForCategory(project.category);
    if (phases.length === 0) return true; // No phases?

    // Check if we have state for all phases and they are all locked/approved
    // We need to map the stored phase states to the category phases
    // This logic depends on how phase states are stored. 
    // Assuming getPhaseStates returns { phase_id: string, status: string, ... }

    // Basic check: do we have a locked state for each expected phase?
    // A more robust check might be needed depending on exact data structure
    // Check if we have locked phases matching the expected count
    // Also ensuring phaseStates is populated
    if (phaseStates.length === 0) return false;

    const lockedPhases = phaseStates.filter(p => p.status === 'locked');
    return lockedPhases.length >= phases.length;
  };

  const allPhasesCompleted = areAllPhasesCompleted();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const [bidFormData, setBidFormData] = useState({
    amount: "",
    proposal: "",
  });
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking'>('overview');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [collaborationDialogOpen, setCollaborationDialogOpen] = useState(false);
  const [financialDialogOpen, setFinancialDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);

  // Financial profile check
  const { isComplete: hasFinancialProfile, isLoading: financialLoading } = useFinancialProfile();

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
      fetchBids();
    }
  }, [id]);

  useEffect(() => {
    if (user && id) {
      checkVerification();
      fetchCreditBalance();
      fetchLeadProfile();
    }
  }, [user, id]);

  const fetchLeadProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      if (!error && data) {
        setLeadProfile(data);
      }
    } catch (error) {
      console.error("Error fetching lead profile:", error);
    }
  };

  const fetchCreditBalance = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.rpc('get_freelancer_credit_balance', {
        _user_id: user.id
      });

      if (error) throw error;
      setCreditBalance(data || 0);
    } catch (error) {
      console.error('Error fetching credit balance:', error);
    }
  };

  const checkVerification = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('freelancer_access')
        .select('has_access')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      if (error && error.code !== 'PGRST116') throw error;
      setIsVerifiedStudent(data?.has_access || false);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const fetchProjectDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", id)
        .single();

      console.log("Project ID:", id);
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) throw error;
      const projectRow = data;
      setProject(data as any);

      if (id) {
        const [states, projectTasks] = await Promise.all([
          ProjectTrackingService.getPhaseStates(id),
          ProjectTrackingService.getTasks(id)
        ]);
        setPhaseStates(states);
        setTasks(projectTasks);
      }

      // Fetch client profile
      if (projectRow?.user_id) {
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("first_name, last_name, city")
          .eq("user_id", projectRow.user_id)
          .maybeSingle();

        console.log("User ID:", projectRow.user_id);
        console.log("Data:", profileData);
        console.log("Error:", profileError);

        if (!profileError && profileData) {
          setClientProfile(profileData as ClientProfile);
        }
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
      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          freelancer:user_profiles!bids_freelancer_id_fkey(first_name, last_name, profile_picture_url)
        `)
        .eq("project_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBids(data || []);
    } catch (error) {
      console.error("Error fetching bids:", error);
    }
  };

  const handlePlaceBid = async () => {
    if (!user?.id || !id || !project) {
      toast.error("Please log in to place a bid");
      navigate('/login');
      return;
    }
    if (creditBalance < 10) {
      toast.error("Insufficient credits. You need 10 credits to place a bid.");
      return;
    }

    try {
      bidSchema.parse(bidFormData);

      const bidAmount = parseFloat(bidFormData.amount);
      const minBid = project.budget ? project.budget * 0.8 : 0;
      const maxBid = project.budget || Infinity;

      // Validate minimum bid (80% of budget)
      if (project.budget && bidAmount < minBid) {
        toast.error(`Minimum bid is ₹${Math.ceil(minBid).toLocaleString()} (80% of project budget)`);
        return;
      }

      // Validate maximum bid (cannot exceed project budget)
      if (project.budget && bidAmount > maxBid) {
        toast.error(`Maximum bid is ₹${maxBid.toLocaleString()} (project budget). You cannot exceed the project budget.`);
        return;
      }

      const { data: existingBid, error: existingBidError } = await supabase
        .from("bids")
        .select("id")
        .eq("project_id", id)
        .eq("freelancer_id", user.id);

      console.log("User ID:", user?.id);
      console.log("Data:", existingBid);
      console.log("Error:", existingBidError);

      if (existingBid?.[0]) {
        toast.error("You have already placed a bid on this project");
        return;
      }

      // Close dialog and navigate to payout preview page
      setDialogOpen(false);

      // Navigate to bid payout preview page with bid details
      const params = new URLSearchParams({
        projectId: id,
        amount: bidFormData.amount,
        proposal: encodeURIComponent(bidFormData.proposal.trim()),
      });
      navigate(`/bid-preview?${params.toString()}`);

    } catch (error: unknown) {
      console.error("Error validating bid:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to validate bid");
      }
    }
  };



  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleApproveWithPayment = async () => {
    if (!project) return;
    try {
      toast.loading("Approving project completion...", { id: "approve-completion" });

      await ProjectTrackingService.approveProjectCompletion(project.id);

      toast.dismiss("approve-completion");
      toast.success("Project marked as completed! 🎉");

      // Refresh project details
      fetchProjectDetails();
    } catch (error: any) {
      console.error("Error approving completion:", error);
      toast.dismiss("approve-completion");
      toast.error(error.message || "Failed to approve project completion.");
    }
  };

  const handleAcceptBid = async (bidId: string) => {
    if (!project) return;
    try {
      await BidService.acceptBid(bidId, project.id);
      toast.success("Bid accepted successfully!");

      // Refresh project and bids
      fetchProjectDetails();
      fetchBids();
    } catch (error) {
      console.error("Error accepting bid:", error);
      toast.error("Failed to accept bid");
    }
  };

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

  const isProjectOwner = user?.id === project.user_id;
  const biddingClosed = project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false;
  const canPlaceBid = !isProjectOwner && project.status === 'open' && !biddingClosed;
  const userAlreadyBid = bids.some((bid: Bid) => bid.freelancer_id === user?.id);
  const isAcceptedFreelancer = bids.some((bid: Bid) => bid.freelancer_id === user?.id && bid.status === 'accepted');
  const projectImage = project.cover_image_url || project.image_url;
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
                    <span className="px-2 py-0.5 bg-accent-green text-[#052005] text-[9px] font-bold rounded-full flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-[#145214]"></span> {project.status === 'open' ? 'Active Project' : project.status === 'in_progress' ? 'In Progress' : 'Completed'}
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
                {/* Action Buttons - Right Side */}
                <div className="flex flex-row gap-2 items-center">
                  <button
                    onClick={() => navigate(`/messages?project=${project.id}`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Open Message
                  </button>
                  {canPlaceBid && !userAlreadyBid && (
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-purple text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary-purple/90 transition-colors">
                          <Coins className="w-4 h-4" />
                          Place a Bid
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Place a Bid</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="amount" className="text-right">
                              Bid Amount (₹)
                            </Label>
                            <Input
                              id="amount"
                              type="number"
                              placeholder={project?.budget ? `Suggested near ₹${project.budget}` : "Enter your bid amount"}
                              value={bidFormData.amount}
                              onChange={(e) => setBidFormData({ ...bidFormData, amount: e.target.value })}
                            />
                            {project?.budget && (
                              <p className="text-xs text-slate-500">
                                Minimum: ₹{Math.ceil(project.budget * 0.8).toLocaleString()} (80%)<br />
                                Maximum: ₹{project.budget.toLocaleString()} (100%)
                              </p>
                            )}
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="proposal" className="text-right">
                              Proposal / Cover Letter
                            </Label>
                            <Textarea
                              id="proposal"
                              placeholder="Why are you the best fit for this project? (Min 20 characters)"
                              value={bidFormData.proposal}
                              onChange={(e) => setBidFormData({ ...bidFormData, proposal: e.target.value })}
                              className="min-h-[150px]"
                            />
                          </div>
                        </div>
                        <Button onClick={handlePlaceBid} className="w-full bg-primary-purple hover:bg-primary-purple/90">
                          Submit Bid (10 Credits)
                        </Button>
                      </DialogContent>
                    </Dialog>
                  )}
                  {userAlreadyBid && (
                    <Button disabled variant="outline" className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-sm border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Bid Submitted
                    </Button>
                  )}
                  <button
                    onClick={() => setCollaborationDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-yellow text-[#73480d] text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Collaborator
                  </button>
                  {isAcceptedFreelancer && (
                    <button
                      onClick={() => {
                        if (project?.status === 'completion_requested') {
                          toast.info("Completion request already sent. Waiting for client approval.");
                          return;
                        }
                        if (project?.status === 'completed') {
                          return;
                        }

                        if (!allPhasesCompleted) {
                          toast.error("Please complete and get approval for all project phases first.");
                          return;
                        }
                        if (canPlaceBid) return; // Should not be visible if placing bid

                        // Open submission dialog
                        setCompletionDialogOpen(true);
                      }}
                      disabled={project?.status === 'completed' || project?.status === 'completion_requested' || !allPhasesCompleted}
                      className={`inline-flex items-center gap-2 px-4 py-2 ${project?.status === 'completed' ? 'bg-green-100 text-green-700' :
                        project?.status === 'completion_requested' ? 'bg-amber-100 text-amber-700' :
                          !allPhasesCompleted ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                            'bg-accent-green text-[#052005] hover:shadow-md'
                        } text-xs font-bold rounded-xl shadow-sm transition-all`}
                    >
                      {project?.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Completed
                        </>
                      ) : project?.status === 'completion_requested' ? (
                        <>
                          <Clock className="w-4 h-4" />
                          In Review
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Submit for Completion
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}

          {/* Client Approval Banner */}
          {isProjectOwner && project.status === 'completion_requested' && (
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
                  onClick={handleApproveWithPayment}
                >
                  Approve Completion
                </Button>
              </div>
            </div>
          )}

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
              {isAcceptedFreelancer && (
                <button
                  onClick={() => setActiveTab('tracking')}
                  className={`px-5 py-2 text-[11px] font-bold tracking-wide transition-all rounded-lg ${activeTab === 'tracking'
                    ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/20'
                    : 'text-slate-900 hover:text-slate-700 bg-transparent'
                    }`}
                >
                  Project Tracking
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          {activeTab === 'tracking' ? (
            <ProjectTrackingBoard
              projectId={project?.id || ''}
              projectCategory={project?.category || null}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-7">
              <div className="lg:col-span-8 flex flex-col gap-7">
                {/* Project Visual */}
                <div className="flex flex-col gap-5">
                  <div className="relative w-full max-w-full md:max-w-[90%] aspect-[16/9] rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 group">
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 p-4 sm:p-5 bg-secondary border border-slate-100 rounded-2xl shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-black mb-1.5">
                        {acceptedBid ? 'Accepted Bid' : 'Estimated Budget'}
                      </span>
                      <span className="text-lg font-bold text-black">
                        ₹{effectiveBudget.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex flex-col sm:border-x border-slate-100 sm:px-5">
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
                                {isPdf ? <DocIcon className="w-5 h-5" /> : <Paperclip className="w-5 h-5" />}
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
                      const remaining = phases.filter((_, i) => getPhasePaymentStatus(i, phaseStates, tasks, phases) !== 'done').length;
                      return (
                        <>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {phases.map((phase, index) => {
                              const paymentStatus = getPhasePaymentStatus(index, phaseStates, tasks, phases);
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
                            Remaining Payments: {remaining} out of {phases.length}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </section>

                {/* Bids Section for Project Owner */}
                {isProjectOwner && (
                  <section className="space-y-5 pt-7 border-t border-slate-300">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-1.5 h-5 bg-primary-purple rounded-full"></span>
                      Received Bids ({bids.length})
                    </h2>
                    {bids.length === 0 ? (
                      <p className="text-sm text-slate-500 italic">No bids received yet.</p>
                    ) : (
                      <div className="grid gap-4">
                        {bids.map((bid) => (
                          <div key={bid.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-slate-900 text-base">
                                    {(bid as any).freelancer?.first_name} {(bid as any).freelancer?.last_name}
                                  </h3>
                                  <span className="text-xs text-slate-400">• {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}</span>
                                </div>

                                <div className="mb-3">
                                  <span className="text-lg font-bold text-primary-purple">₹{bid.amount.toLocaleString()}</span>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                                  {bid.proposal}
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-2">
                                {bid.status === 'pending' && project.status === 'open' && (
                                  <Button
                                    onClick={() => handleAcceptBid(bid.id)}
                                    className="bg-primary-purple hover:bg-primary-purple/90 text-white"
                                  >
                                    Accept Bid
                                  </Button>
                                )}
                                {bid.status === 'accepted' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Accepted
                                  </span>
                                )}
                                {bid.status === 'rejected' && (
                                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
                                    Rejected
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-4 space-y-7">
                <div className="sticky top-24 space-y-5">
                  {/* Place Bid Button */}
                  {canPlaceBid && !userAlreadyBid && creditBalance >= 10 && (
                    <>
                      <FinancialProfileRequiredDialog
                        open={financialDialogOpen}
                        onOpenChange={setFinancialDialogOpen}
                        action="bid"
                      />

                      <ProjectCompletionDialog
                        open={completionDialogOpen}
                        onOpenChange={setCompletionDialogOpen}
                        projectId={project?.id || ''}
                        onSuccess={() => {
                          fetchProjectDetails(); // Refresh to update status
                        }}
                      />

                      <ProjectCompletionRejectionDialog
                        open={rejectionDialogOpen}
                        onOpenChange={setRejectionDialogOpen}
                        projectId={project?.id || ''}
                        onSuccess={() => {
                          fetchProjectDetails();
                        }}
                      />

                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => {
                              // TEMPORARILY DISABLED FOR TESTING - Re-enable when ready
                              // Check financial profile first
                              // if (!hasFinancialProfile && !financialLoading) {
                              //   e.preventDefault();
                              //   setFinancialDialogOpen(true);
                              //   return;
                              // }
                            }}
                            className="w-full bg-primary-purple hover:bg-primary-purple/90 text-white py-3.5 rounded-2xl font-extrabold text-sm shadow-xl shadow-primary-purple/40 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-1.5"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            Place Your Bid
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-base">Place Your Bid</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-3 mt-3">
                            {/* Credit balance and cost - combined row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 flex-1">
                                <Coins className="w-3.5 h-3.5 text-primary-purple" />
                                <span className="text-xs">Balance: <span className="font-bold text-primary-purple">{creditBalance} credits</span></span>
                              </div>
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-700">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">-10 credits</span>
                              </div>
                            </div>
                            {/* Token Refund Policy – compact */}
                            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 space-y-1">
                              <p className="text-[10px] font-semibold text-slate-700">Token Refund Policy</p>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-600 shrink-0" />
                                  <span>Refunded if client cancels</span>
                                </p>
                                <p className="text-[10px] text-slate-600 flex items-center gap-1">
                                  <X className="h-3 w-3 text-amber-600 shrink-0" />
                                  <span>Not refunded if not selected</span>
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="bid-amount" className="text-sm">Bid Amount (₹)</Label>
                              <Input
                                id="bid-amount"
                                type="number"
                                placeholder={project?.budget ? `₹${Math.ceil(project.budget * 0.8).toLocaleString()} - ₹${project.budget.toLocaleString()}` : "Enter your bid amount"}
                                value={bidFormData.amount}
                                onChange={(e) => setBidFormData({ ...bidFormData, amount: e.target.value })}
                                className="mt-1 h-9"
                                min={project?.budget ? Math.ceil(project.budget * 0.8) : 0}
                                max={project?.budget || undefined}
                              />
                              {project?.budget && (
                                <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                                  <p>Min bid: ₹{Math.ceil(project.budget * 0.8).toLocaleString()} (80% of budget)</p>
                                  <p>Max bid: ₹{project.budget.toLocaleString()} (Project budget)</p>
                                </div>
                              )}
                            </div>
                            <div>
                              <Label htmlFor="bid-proposal" className="text-sm">Proposal</Label>
                              <Textarea
                                id="bid-proposal"
                                placeholder="Describe why you're the best fit for this project..."
                                value={bidFormData.proposal}
                                onChange={(e) => setBidFormData({ ...bidFormData, proposal: e.target.value })}
                                className="mt-1 min-h-[100px]"
                                maxLength={3000}
                              />
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                {bidFormData.proposal.length}/3000 characters
                              </p>
                            </div>
                            <div className="flex items-start gap-2 p-2 rounded-lg bg-primary-purple/5 border border-primary-purple/10">
                              <FileText className="w-3.5 h-3.5 text-primary-purple shrink-0 mt-0.5" />
                              <p className="text-[10px] text-slate-600 leading-relaxed">
                                <span className="font-bold text-primary-purple">Next:</span> Review payout breakdown (Platform fee, GST, TCS, TDS) before confirming.
                              </p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={handlePlaceBid}>
                                Review Payout & Continue
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </>
                  )}

                  {/* Client Info */}
                  {clientProfile && (
                    <div className="bg-accent-green rounded-2xl p-5 border border-slate-100 shadow-lg shadow-slate-100/50">
                      <h3 className="text-[9px] font-extrabold uppercase text-slate-900 tracking-[0.2em] mb-5">About the Client</h3>
                      <div className="flex items-center gap-3.5 mb-5">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md ring-2 ring-slate-50">
                          {clientProfile.profile_picture_url ? (
                            <img src={clientProfile.profile_picture_url} alt={clientProfile.first_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary-purple flex items-center justify-center text-white font-bold text-base">
                              {clientProfile.first_name?.[0]}{clientProfile.last_name?.[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">
                            {clientProfile.first_name} {clientProfile.last_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
                            <Star className="w-3 h-3 text-secondary-yellow fill-secondary-yellow" />
                            <span className="text-slate-800">4.9</span>
                            <span className="text-slate-400 font-medium">(24 Reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3.5 mb-5">
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>
                          <span>Payment Verified</span>
                        </div>
                        {clientProfile.city && (
                          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                            <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                              <LocationIcon className="w-3.5 h-3.5" />
                            </div>
                            <span>{clientProfile.city}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-900">
                          <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                          </div>
                          <span>Member since {format(new Date(project.created_at), 'yyyy')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <AgreementDialog
          open={agreementDialogOpen}
          onOpenChange={setAgreementDialogOpen}
          type="freelancer"
        />
        <CollaborationDialog
          open={collaborationDialogOpen}
          onOpenChange={setCollaborationDialogOpen}
          project={project}
          clientProfile={clientProfile}
          leadName={leadProfile ? `${leadProfile.first_name} ${leadProfile.last_name}` : "Lead"}
        />

        {project && (
          <ProjectCompletionDialog
            open={completionDialogOpen}
            onOpenChange={setCompletionDialogOpen}
            projectId={project.id}
            onSuccess={() => {
              fetchProjectDetails();
              setCompletionDialogOpen(false);
            }}
          />
        )}
      </main>
    );
  })();
};

export default ProjectDetailPage;

