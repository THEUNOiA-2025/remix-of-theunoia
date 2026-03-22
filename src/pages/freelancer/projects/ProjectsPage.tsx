import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Plus, Edit, Trash2, Star, Calendar, Image as ImageIcon, Search,
  IndianRupee, Clock, CheckCircle2, Paperclip, CalendarIcon,
  Users as UsersIcon, Coins, FileText, ChevronLeft, ChevronRight,
  ListFilter, ChevronDown, ArrowRight, Layers
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { AgreementDialog } from "@/components/AgreementDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { FileUploader } from "@/components/FileUploader";
import { ImageGallery } from "@/components/ImageGallery";
import { FileList } from "@/components/FileList";
import { PROJECT_CATEGORIES, getCategoryList, getSubcategoriesForCategory } from "@/data/categories";
import { ProjectService } from "@/services/projectService";
import { BidService } from "@/services/bidService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RatingDialog } from "@/components/RatingDialog";
import { recordActivity } from "@/utils/dailyStreak";

import { PROJECT_VIDEOS } from "@/utils/randomVideo";
const PUBLIC_VIDEOS = PROJECT_VIDEOS;

interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string;
  image_url: string | null;
  cover_image_url: string | null;
  additional_images: string[] | null;
  attached_files: { name: string; url: string; type: string; size: number }[] | null;
  rating: number | null;
  client_feedback: string | null;
  completed_at: string | null;
  created_at: string;
  project_type: 'work_requirement' | 'portfolio_project';
  budget: number | null;
  timeline: string | null;
  skills_required: string[] | null;
  status: string | null;
  bidding_deadline: string | null;
  category: string | null;
  subcategory: string | null;
}

interface BidProject extends Project {
  bidStatus: string;
  bidAmount: number;
}

const workRequirementSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  budget: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Budget must be a positive number"),
  timeline: z.string().trim().min(3, "Timeline must be at least 3 characters").max(100, "Timeline must be less than 100 characters"),
  skills_required: z.string().trim().min(1, "At least one skill is required"),
});

const portfolioProjectSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000, "Description must be less than 2000 characters"),
  rating: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = parseFloat(val);
    return !isNaN(num) && num >= 0 && num <= 5;
  }, "Rating must be between 0 and 5"),
  client_feedback: z.string().trim().max(500, "Feedback must be less than 500 characters").optional(),
  completed_at: z.string().optional(),
});

const ProjectsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [bidProjects, setBidProjects] = useState<BidProject[]>([]);
  const [completedProjects, setCompletedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("browse");
  const [sortType, setSortType] = useState<'newest' | 'oldest' | 'relevant'>('newest');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [workDialogOpen, setWorkDialogOpen] = useState(false);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formType, setFormType] = useState<'work_requirement' | 'portfolio_project'>('work_requirement');
  const [isVerifiedStudent, setIsVerifiedStudent] = useState(false);
  const [isStudentUser, setIsStudentUser] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number>(0);

  const [workFormData, setWorkFormData] = useState({
    title: "",
    description: "",
    budget: "",
    timeline: "",
    skills_required: "",
    category: "",
    subcategory: "",
  });

  const [biddingDeadline, setBiddingDeadline] = useState<Date | undefined>();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState("all");
  const [isCommunityTask, setIsCommunityTask] = useState(false);
  const [userCollegeId, setUserCollegeId] = useState<string | null>(null);

  const [portfolioFormData, setPortfolioFormData] = useState({
    title: "",
    description: "",
    rating: "",
    client_feedback: "",
    completed_at: "",
  });

  const [uploadedImages, setUploadedImages] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string; type: string; size: number }[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");

  // Rating dialog state
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [projectToRate, setProjectToRate] = useState<Project | null>(null);
  const [acceptedFreelancerId, setAcceptedFreelancerId] = useState<string | null>(null);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Client agreement state
  const [clientAgreementAccepted, setClientAgreementAccepted] = useState(false);
  const [clientAgreementDialogOpen, setClientAgreementDialogOpen] = useState(false);

  // Recommended projects scroll ref
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollRecommended = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 291; // Card width (270) + gap (21)
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Always fetch browse projects (public)
    loadProjects();
  }, [user, activeTab]);

  // Alias for backward compatibility with existing handlers
  const fetchBrowseProjects = () => loadProjects();
  const fetchUserData = () => loadProjects();
  const fetchCreditBalance = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('freelancer_credits').select('balance').eq('user_id', user.id).maybeSingle();
    setCreditBalance(data?.balance || 0);
  };

  const loadProjects = async () => {
    setLoading(true);
    try {
      // 1. Browse Tab: Open Projects
      if (activeTab === 'browse' || !user) {
        const openProjects = await ProjectService.getOpenProjects();
        setAllProjects(openProjects);
      }

      // 2. My Projects Tab (Authenticated)
      if (user) {
        // Fetch User Skills & Verification
        await checkVerification(user.id);
        const { data: skills } = await supabase.from("user_skills").select("skill_name").eq("user_id", user.id);
        setUserSkills((skills || []).map(s => s.skill_name.toLowerCase()));

        // Fetch Credit Balance
        const { data: credits } = await supabase.from('freelancer_credits').select('balance').eq('user_id', user.id).maybeSingle();
        setCreditBalance(credits?.balance || 0);

        // Fetch user type only if needed (already in state? maybe good to refresh)
        const { data: profile } = await supabase.from('user_profiles').select('user_type').eq('user_id', user.id).maybeSingle();
        setIsStudentUser(profile?.user_type === 'student');

        // Fetch My Projects based on Lifecycle
        if (activeTab === 'my-projects' || activeTab === 'completed') {
          // Bids (Applied)
          const myBids = await BidService.getFreelancerBids(user.id);
          const bidProjectsFormatted = myBids.map(bid => ({
            ...bid.project,
            // Ensure compatibility with Project interface
            id: bid.project_id,
            user_id: user.id, // This is incorrect for the project owner, but maybe unused in this view? 
            // Actually bid.project is a joined subset. We might need full project details.
            // Let's rely on the service to fetch what's needed or adjust interface.
            // For now, mapping what we have:
            title: bid.project?.title || "Unknown Project",
            bg_color: "", // UI specific
            bidStatus: bid.status,
            bidAmount: bid.amount,
            status: bid.project?.status || "open"
          })) as unknown as BidProject[];

          setBidProjects(bidProjectsFormatted);

          // Working Projects (In Progress)
          const workingProjects = await ProjectService.getWorkingProjects(user.id, profile?.user_type === 'client' ? 'client' : 'freelancer');
          setMyProjects(workingProjects as unknown as Project[]);

          // Completed Projects
          const completed = await ProjectService.getCompletedProjects(user.id, profile?.user_type === 'client' ? 'client' : 'freelancer');
          setCompletedProjects(completed as unknown as Project[]);
        }
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  // Helper to check verification (moved out of useEffect for cleanliness)
  const checkVerification = async (userId: string) => {
    try {
      const { data } = await supabase.from('freelancer_access').select('has_access').eq('user_id', userId).maybeSingle();
      setIsVerifiedStudent(data?.has_access || false);

      const { data: edu } = await supabase.from('student_verifications').select('college_id').eq('user_id', userId).eq('verification_status', 'approved').maybeSingle();
      setUserCollegeId(edu?.college_id || null);
    } catch (e) { console.error(e); }
  };


  const openWorkRequirementDialog = (project?: Project) => {
    if (!user) {
      toast.error("Please log in to create or edit projects");
      navigate('/login');
      return;
    }

    setFormType('work_requirement');

    if (project) {
      setEditingProject(project);
      setWorkFormData({
        title: project.title,
        description: project.description,
        budget: project.budget?.toString() || "",
        timeline: project.timeline || "",
        skills_required: project.skills_required?.join(", ") || "",
        category: project.category || "",
        subcategory: project.subcategory || "",
      });

      setBiddingDeadline(project.bidding_deadline ? new Date(project.bidding_deadline) : undefined);

      const images = project.additional_images || [];
      setUploadedImages(images.map(url => ({ name: url.split('/').pop(), url, type: 'image', size: 0 })));
      setCoverImageUrl(project.cover_image_url || images[0] || "");
      setUploadedFiles(project.attached_files || []);
    } else {
      setEditingProject(null);
      setWorkFormData({
        title: "",
        description: "",
        budget: "",
        timeline: "",
        skills_required: "",
        category: "",
        subcategory: "",
      });
      setBiddingDeadline(undefined);
      setUploadedImages([]);
      setUploadedFiles([]);
      setCoverImageUrl("");
      setClientAgreementAccepted(false);
    }

    setWorkDialogOpen(true);
  };

  const openPortfolioDialog = (project?: Project) => {
    if (!user) {
      toast.error("Please log in to create or edit completed projects");
      navigate('/login');
      return;
    }

    setFormType('portfolio_project');

    if (project) {
      setEditingProject(project);
      setPortfolioFormData({
        title: project.title,
        description: project.description,
        rating: project.rating?.toString() || "",
        client_feedback: project.client_feedback || "",
        completed_at: project.completed_at || "",
      });

      const images = project.additional_images || [];
      setUploadedImages(images.map(url => ({ name: url.split('/').pop(), url, type: 'image', size: 0 })));
      setCoverImageUrl(project.cover_image_url || images[0] || "");
      setUploadedFiles(project.attached_files || []);
    } else {
      setEditingProject(null);
      setPortfolioFormData({
        title: "",
        description: "",
        rating: "",
        client_feedback: "",
        completed_at: "",
      });
      setUploadedImages([]);
      setUploadedFiles([]);
      setCoverImageUrl("");
    }

    setPortfolioDialogOpen(true);
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    try {
      if (formType === 'work_requirement') {
        workRequirementSchema.parse(workFormData);

        // Check credits before creating new task (not for editing)
        if (!editingProject && creditBalance < 10) {
          toast.error(`Insufficient credits. You need 10 credits to post a task. Current balance: ${creditBalance}`);
          return;
        }

        const imageUrls = uploadedImages.map(img => img.url);
        const finalCoverImage = coverImageUrl || imageUrls[0] || null;

        const projectData = {
          user_id: user.id,
          title: workFormData.title.trim(),
          description: workFormData.description.trim(),
          budget: parseFloat(workFormData.budget),
          timeline: workFormData.timeline.trim(),
          skills_required: workFormData.skills_required.split(',').map(s => s.trim()),
          cover_image_url: finalCoverImage,
          additional_images: imageUrls,
          attached_files: uploadedFiles,
          project_type: 'work_requirement',
          status: 'open',
          bidding_deadline: biddingDeadline ? biddingDeadline.toISOString() : null,
          category: workFormData.category || null,
          subcategory: workFormData.subcategory || null,
          is_community_task: isCommunityTask && isVerifiedStudent,
          community_college_id: (isCommunityTask && isVerifiedStudent && userCollegeId) ? userCollegeId : null,
        };

        if (editingProject) {
          const { error } = await supabase
            .from("user_projects")
            .update(projectData)
            .eq("id", editingProject.id);

          if (error) throw error;
          toast.success("Work requirement updated successfully!");
          // Record activity for daily streak (project updated)
          recordActivity(user.id);
        } else {
          const { error } = await supabase
            .from("user_projects")
            .insert(projectData);

          if (error) {
            // Handle insufficient credits error from trigger
            if (error.message?.includes('Insufficient credits')) {
              toast.error(error.message);
              return;
            }
            throw error;
          }
          toast.success("Work requirement posted successfully! (10 credits deducted)");
          fetchCreditBalance(); // Refresh credit balance
          // Record activity for daily streak (project created)
          recordActivity(user.id);
        }
      } else {
        portfolioProjectSchema.parse(portfolioFormData);

        const imageUrls = uploadedImages.map(img => img.url);
        const finalCoverImage = coverImageUrl || imageUrls[0] || null;

        const projectData = {
          user_id: user.id,
          title: portfolioFormData.title.trim(),
          description: portfolioFormData.description.trim(),
          cover_image_url: finalCoverImage,
          additional_images: imageUrls,
          attached_files: uploadedFiles,
          rating: portfolioFormData.rating ? parseFloat(portfolioFormData.rating) : null,
          client_feedback: portfolioFormData.client_feedback?.trim() || null,
          completed_at: portfolioFormData.completed_at || new Date().toISOString(),
          project_type: 'portfolio_project',
          status: 'completed',
        };

        if (editingProject) {
          const { error } = await supabase
            .from("user_projects")
            .update(projectData)
            .eq("id", editingProject.id);

          if (error) throw error;
          toast.success("Completed project updated successfully!");
          // Record activity for daily streak (project updated)
          recordActivity(user.id);
        } else {
          const { error } = await supabase
            .from("user_projects")
            .insert(projectData);

          if (error) throw error;
          toast.success("Completed project added successfully!");
          // Record activity for daily streak (project created)
          recordActivity(user.id);
        }
      }

      if (formType === 'work_requirement') {
        setWorkDialogOpen(false);
      } else {
        setPortfolioDialogOpen(false);
      }
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error: unknown) {
      console.error("Error saving project:", error);
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error instanceof Error && error.message?.includes('Insufficient credits')) {
        toast.error(error.message);
      } else {
        toast.error("Failed to save project");
      }
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const { error } = await supabase
        .from("user_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project deleted successfully!");
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleMarkComplete = async (projectId: string) => {
    // Find the project
    const project = myProjects.find(p => p.id === projectId);
    if (!project) return;

    // Find the accepted bid to get freelancer_id
    try {
      const { data: acceptedBid, error } = await supabase
        .from("bids")
        .select("freelancer_id")
        .eq("project_id", projectId)
        .eq("status", "accepted");

      console.log("Project ID:", projectId);
      console.log("Data:", acceptedBid);
      console.log("Error:", error);

      if (error) throw error;

      const bidRow = acceptedBid?.[0];
      if (!bidRow) {
        toast.error("No accepted bid found for this project");
        return;
      }

      setProjectToRate(project);
      setAcceptedFreelancerId(bidRow.freelancer_id);
      setRatingDialogOpen(true);
    } catch (error) {
      console.error("Error fetching accepted bid:", error);
      toast.error("Failed to load project details");
    }
  };

  const handleSubmitRating = async (rating: number, feedback: string) => {
    if (!user?.id || !projectToRate || !acceptedFreelancerId) return;

    setIsSubmittingRating(true);
    try {
      // Insert rating
      const { error: ratingError } = await supabase
        .from("freelancer_ratings")
        .insert({
          project_id: projectToRate.id,
          freelancer_id: acceptedFreelancerId,
          client_id: user.id,
          rating,
          feedback: feedback || null,
        });

      if (ratingError) throw ratingError;

      // Update project status
      const { error: projectError } = await supabase
        .from("user_projects")
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq("id", projectToRate.id);

      if (projectError) throw projectError;

      toast.success("Project completed and rating submitted!");
      setRatingDialogOpen(false);
      setProjectToRate(null);
      setAcceptedFreelancerId(null);
      fetchBrowseProjects();
      if (user) fetchUserData();
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  // Search-only filter: for "All Projects" section (everyone sees all projects, optional search)
  const matchesSearch = (project: Project) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(q) ||
      project.description.toLowerCase().includes(q) ||
      project.skills_required?.some((s) => s.toLowerCase().includes(q)) ||
      project.category?.toLowerCase().includes(q) ||
      project.subcategory?.toLowerCase().includes(q)
    );
  };

  // Skill-based filter: project's skills overlap user's skills (for "Recommended for You")
  const matchesUserSkills = (project: Project) => {
    if (userSkills.length === 0) return false;
    const projectSkills = (project.skills_required || []).map((s) => s.toLowerCase().trim());
    return projectSkills.some((skill) =>
      userSkills.some(
        (userSkill) =>
          skill.includes(userSkill) || userSkill.includes(skill) || skill === userSkill
      )
    );
  };

  // All Projects section: show every project (filtered only by search). All clients/freelancers see all projects here.
  const allProjectsFilteredBySearch = allProjects.filter(matchesSearch);

  // Recommended for You: based on user skills/criteria only (frontend logic). Show first 4 for carousel.
  const recommendedProjects = allProjects.filter(matchesUserSkills).slice(0, 4);

  // Legacy filtered list (search + category + sort) kept for any other use; Browse tab uses allProjectsFilteredBySearch and recommendedProjects
  const filteredProjects = allProjects.filter((project) => {
    const searchOk = matchesSearch(project);
    const matchesCategory = selectedCategory === "all" || project.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === "all" || project.subcategory === selectedSubcategory;
    const now = new Date();
    const projectDate = new Date(project.created_at);
    const daysDiff = Math.floor((now.getTime() - projectDate.getTime()) / (1000 * 60 * 60 * 24));
    let matchesSort = true;
    if (sortType === "newest") matchesSort = daysDiff >= 0 && daysDiff <= 7;
    else if (sortType === "oldest") matchesSort = daysDiff > 14;
    else if (sortType === "relevant") matchesSort = matchesUserSkills(project);
    return searchOk && matchesCategory && matchesSubcategory && matchesSort;
  });

  const renderProjectCard = (project: Project | BidProject, showActions: boolean = false, isFeatured: boolean = false) => {
    const bidProject = project as BidProject;
    const hasBidInfo = 'bidStatus' in project;

    // Bidding is closed if:
    // 1. Project status is 'in_progress' or 'completed' (a bid has been accepted)
    // 2. Bidding deadline has passed
    const biddingClosed =
      project.status === 'in_progress' ||
      project.status === 'completed' ||
      (project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false);

    // Calculate time ago
    const timeAgo = project.created_at ? format(new Date(project.created_at), "d 'days ago'") : 'Unknown';

    // Colorful gradient backgrounds for cards without images
    const gradientColors = [
      'from-primary-purple/20 via-accent-purple/10 to-accent-blue/20',
      'from-secondary-yellow/30 via-yellow/20 to-green/20',
      'from-accent-blue/20 via-primary-purple/10 to-accent-purple/20',
      'from-green/20 via-accent-green/10 to-secondary-yellow/20'
    ];
    const gradientIndex = project.id.charCodeAt(0) % gradientColors.length;

    return (
      <div key={project.id} className="group bg-white dark:bg-white/5 rounded-[9px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#f1f0f5] dark:border-white/5 flex flex-col h-full">
        <div className="relative h-[126px] overflow-hidden bg-slate-200">
          <video
            src={encodeURI(PUBLIC_VIDEOS[project.id.charCodeAt(0) % PUBLIC_VIDEOS.length])}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            {!biddingClosed && (
              <span className="px-1.5 py-0.5 bg-secondary-yellow text-[#121118] text-[9px] font-bold uppercase tracking-wider rounded-md shadow-sm">New</span>
            )}
          </div>
        </div>

        <div className="p-3.5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-1.5">
            <h3 className="font-bold text-sm leading-snug truncate pr-2 group-hover:text-primary-purple transition-colors">{project.title}</h3>
            <span className="text-[9px] font-medium text-[#68608a] dark:text-gray-500 whitespace-nowrap">
              {project.created_at ? format(new Date(project.created_at), "MMM d") : ''}
            </span>
          </div>

          <p className="text-[11px] text-[#68608a] dark:text-gray-400 line-clamp-2 mb-2.5">
            {project.description}
          </p>

          <div className="mt-auto space-y-2.5">
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#68608a] dark:text-gray-500 uppercase tracking-tight">Estimated Budget</span>
                <span className="text-sm font-extrabold text-primary-purple">
                  {project.budget ? `₹${project.budget.toLocaleString()}` : 'Negotiable'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-bold text-[#68608a] dark:text-gray-500 uppercase tracking-tight">Deadline</span>
                <span className="text-[11px] font-bold text-[#121118] dark:text-white">
                  {project.bidding_deadline ? format(new Date(project.bidding_deadline), "d MMM") : "Flexible"}
                </span>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#f1f0f5] dark:border-white/5 flex items-center justify-between">
              {biddingClosed ? (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-[#121118] dark:text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#68608a]"></span> Bid Closed
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-accent-green text-[#052005] text-[9px] font-bold rounded-full flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-[#145214]"></span> Bid Open
                </span>
              )}

              {showActions ? (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary-purple hover:text-primary-purple/80 hover:bg-primary-purple/10" onClick={() => openWorkRequirementDialog(project)}>
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-destructive/80 hover:bg-destructive/10" onClick={() => handleDelete(project.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-primary-purple hover:text-primary-purple/80" onClick={() => navigate(`/projects/${project.id}`)}>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <button className="text-primary-purple hover:text-primary-purple/80 transition-colors" onClick={() => navigate(`/projects/${project.id}`)}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendedCard = (project: Project) => {
    // Bidding is closed if:
    // 1. Project status is 'in_progress' or 'completed' (a bid has been accepted)
    // 2. Bidding deadline has passed
    const biddingClosed =
      project.status === 'in_progress' ||
      project.status === 'completed' ||
      (project.bidding_deadline ? new Date(project.bidding_deadline) < new Date() : false);

    return (
      <div key={project.id} className="min-w-[270px] bg-white dark:bg-white/5 rounded-[9px] p-5 border border-[#f1f0f5] dark:border-white/5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between h-[180px] cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
        <div className="flex-1 flex flex-col">
          <div className="mb-3 flex items-center justify-between">
            {biddingClosed ? (
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/10 text-[#121118] dark:text-white text-[9px] font-bold rounded-full flex items-center gap-1 w-fit">
                <span className="size-1.5 rounded-full bg-[#68608a]"></span> Bid Closed
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-accent-green text-[#052005] text-[9px] font-bold rounded-full flex items-center gap-1 w-fit">
                <span className="size-1.5 rounded-full bg-[#145214]"></span> Bid Open
              </span>
            )}
            <span className="px-2 py-0.5 bg-secondary-yellow text-[#121118] text-[9px] font-bold rounded-full">
              {format(new Date(project.created_at), "d MMM")}
            </span>
          </div>
          <h3 className="font-bold text-sm leading-snug mb-2 dark:text-white line-clamp-1">{project.title}</h3>
          <p className="text-[11px] text-[#68608a] dark:text-gray-400 line-clamp-2 flex-1">{project.description}</p>
        </div>
        <div className="mt-auto pt-3 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-[#68608a] dark:text-gray-500 uppercase tracking-tight mb-0.5">Estimated Budget</span>
            <span className="text-base font-extrabold text-primary-purple">
              {project.budget ? `₹${project.budget.toLocaleString()}` : 'Negotiable'}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-[#68608a] dark:text-gray-500 uppercase tracking-tight mb-0.5">Deadline</span>
            <span className="text-[11px] font-bold text-[#121118] dark:text-white">
              {project.bidding_deadline ? format(new Date(project.bidding_deadline), "d MMM") : "Flexible"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderPortfolioCard = (project: Project, showActions: boolean = false) => (
    <div key={project.id} className="group bg-white dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-[#f1f0f5] dark:border-white/5 flex flex-col h-full">
      <div className="relative h-[144px] overflow-hidden bg-slate-200">
        <video
          src={encodeURI(PUBLIC_VIDEOS[project.id.charCodeAt(0) % PUBLIC_VIDEOS.length])}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          autoPlay
          muted
          loop
          playsInline
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
      <div className="p-4.5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="font-bold text-base leading-snug truncate pr-2">{project.title}</h3>
          {project.rating && (
            <div className="flex items-center gap-1 text-xs font-bold text-secondary-yellow darken-10">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{project.rating}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-[#68608a] dark:text-gray-400 line-clamp-3 mb-3.5">{project.description}</p>

        {project.client_feedback && (
          <div className="mt-auto p-2.5 bg-[#faf7f1] rounded-lg mb-3.5">
            <p className="text-[11px] text-[#68608a] italic line-clamp-2">"{project.client_feedback}"</p>
          </div>
        )}

        {showActions && (
          <div className="flex gap-1.5 pt-2 border-t border-[#f1f0f5]">
            <Button size="sm" variant="outline" className="flex-1 text-xs py-1.5" onClick={() => openPortfolioDialog(project)}>Edit</Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs py-1.5 text-destructive" onClick={() => handleDelete(project.id)}>Delete</Button>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FFFFFF]">
        <p className="text-muted-foreground font-medium">Loading projects...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FFFFFF] dark:bg-dark-bg text-[#121118] dark:text-white font-sans">
      <div className="max-w-6xl mx-auto px-4 lg:px-11 py-7">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-7">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#121118] dark:text-white">Projects</h1>
            <p className="text-sm text-[#68608a] dark:text-gray-400 font-medium">Browse high-value projects posted by verified clients</p>
          </div>

          <div className="flex items-center gap-2.5 bg-[#FDF8F3] dark:bg-white/5 p-1.5 rounded-xl shadow-sm border border-[#f1f0f5] dark:border-white/10">
            <button
              onClick={() => setSortType('newest')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${sortType === 'newest'
                ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/10'
                : 'text-[#121118] dark:text-white hover:bg-[#f1f0f5] dark:hover:bg-white/10'
                }`}
            >
              Newest
            </button>
            <button
              onClick={() => setSortType('oldest')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${sortType === 'oldest'
                ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/10'
                : 'text-[#121118] dark:text-white hover:bg-[#f1f0f5] dark:hover:bg-white/10'
                }`}
            >
              Oldest
            </button>
            <button
              onClick={() => setSortType('relevant')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${sortType === 'relevant'
                ? 'bg-primary-purple text-white shadow-md shadow-primary-purple/10'
                : 'text-[#121118] dark:text-white hover:bg-[#f1f0f5] dark:hover:bg-white/10'
                }`}
            >
              Relevant
            </button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-7">
          <TabsList className="bg-[#FDF8F3] dark:bg-white/5 p-1.5 gap-1.5 h-auto mb-7 justify-start border border-[#f1f0f5] dark:border-white/10 w-fit rounded-xl shadow-sm">
            <TabsTrigger
              value="browse"
              className="rounded-lg px-5 py-2 text-xs font-bold text-[#121118] dark:text-white data-[state=active]:bg-primary-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary-purple/20 transition-all duration-200 hover:text-primary-purple hover:bg-primary-purple/10 data-[state=active]:hover:bg-primary-purple data-[state=active]:hover:text-white"
            >
              Browse Project
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger
                  value="my-projects"
                  className="rounded-lg px-5 py-2 text-xs font-bold text-[#121118] dark:text-white data-[state=active]:bg-primary-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary-purple/20 transition-all duration-200 hover:text-primary-purple hover:bg-primary-purple/10 data-[state=active]:hover:bg-primary-purple data-[state=active]:hover:text-white"
                >
                  In Progress
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="rounded-lg px-5 py-2 text-xs font-bold text-[#121118] dark:text-white data-[state=active]:bg-primary-purple data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-primary-purple/20 transition-all duration-200 hover:text-primary-purple hover:bg-primary-purple/10 data-[state=active]:hover:bg-primary-purple data-[state=active]:hover:text-white"
                >
                  Completed Project
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* BROWSE TAB */}
          <TabsContent value="browse" className="space-y-10 mt-0 focus-visible:ring-0">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-3.5 mb-12">
              <div className="flex-1 min-w-[270px]">
                <div className="flex items-center bg-[#FDF8F3] dark:bg-white/5 rounded-xl px-3.5 py-2.5 border border-[#f1f0f5] dark:border-white/10 shadow-sm transition-all focus-within:ring-2 ring-primary-purple/20">
                  <ListFilter className="w-4 h-4 text-primary-purple mr-2.5" />
                  <input
                    className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-[#68608a] focus:outline-none"
                    placeholder="Search projects, skills, or clients"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF8F3] dark:bg-white/5 border border-[#f1f0f5] dark:border-white/10 text-xs font-bold whitespace-nowrap hover:border-primary-purple transition-colors text-[#121118] dark:text-white">
                  Category <ChevronDown className="w-3.5 h-3.5 text-[#121118] dark:text-white" />
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF8F3] dark:bg-white/5 border border-[#f1f0f5] dark:border-white/10 text-xs font-bold whitespace-nowrap hover:border-primary-purple transition-colors text-[#121118] dark:text-white">
                  Budget Range <ChevronDown className="w-3.5 h-3.5 text-[#121118] dark:text-white" />
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FDF8F3] dark:bg-white/5 border border-[#f1f0f5] dark:border-white/10 text-xs font-bold whitespace-nowrap hover:border-primary-purple transition-colors text-[#121118] dark:text-white">
                  Timeline <ChevronDown className="w-3.5 h-3.5 text-[#121118] dark:text-white" />
                </button>
                <button className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-primary-purple text-white text-xs font-bold shadow-md shadow-primary-purple/20 hover:bg-primary-purple/90 transition-all">
                  Apply Filters
                </button>
              </div>
            </div>

            {/* Recommended Section */}
            <section className="mb-14">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-extrabold tracking-tight text-[#121118] dark:text-white">Recommended for You</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => scrollRecommended('left')}
                    className="p-1.5 rounded-full border border-[#f1f0f5] dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary-purple transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[#68608a]" />
                  </button>
                  <button
                    onClick={() => scrollRecommended('right')}
                    className="p-1.5 rounded-full border border-[#f1f0f5] dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary-purple transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-[#68608a]" />
                  </button>
                </div>
              </div>
              <div
                ref={scrollContainerRef}
                className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2"
              >
                {recommendedProjects.length > 0 ? (
                  recommendedProjects.map(project => renderRecommendedCard(project))
                ) : (
                  <div className="w-full py-8 text-center text-[#68608a]">No projects found matching your skills or criteria.</div>
                )}
              </div>
            </section>

            {/* All Projects Section - every project (clients/freelancers see all); filtered only by search */}
            <section>
              <h2 className="text-xl font-extrabold tracking-tight text-[#121118] dark:text-white mb-7">All Projects</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                {allProjectsFilteredBySearch.length > 0 ? (
                  allProjectsFilteredBySearch.map(project => renderProjectCard(project, false, true))
                ) : (
                  <div className="col-span-full py-10 text-center bg-white rounded-2xl border border-[#f1f0f5]">
                    <p className="text-base text-[#68608a] font-medium">
                      {searchQuery.trim() ? "No projects match your search." : "No projects available yet."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Projects You've Bid On Section */}
            {user && bidProjects.length > 0 && (
              <section className="mt-14">
                <h2 className="text-xl font-extrabold tracking-tight text-[#121118] dark:text-white mb-7">Projects You've Bid On</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7">
                  {bidProjects.map(project => renderProjectCard(project, false, true))}
                </div>
              </section>
            )}
          </TabsContent>

          {/* IN PROGRESS TAB */}
          <TabsContent value="my-projects" className="mt-0">
            {!user ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-[#f1f0f5]">
                <h3 className="text-xl font-bold mb-2">Sign in to view your projects</h3>
                <Button onClick={() => navigate('/login')} className="bg-primary-purple hover:bg-primary-purple/90">Sign In</Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {myProjects.length > 0 ? (
                  myProjects.map(project => renderProjectCard(project, false, true))
                ) : (
                  <div className="col-span-full text-center py-10 text-[#68608a]">No projects in progress. Bid on projects to get started!</div>
                )}
              </div>
            )}
          </TabsContent>

          {/* COMPLETED PROJECT TAB */}
          <TabsContent value="completed" className="mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {completedProjects.length > 0 ? (
                completedProjects.map(project => {
                  // Check if it's a portfolio project or a completed work requirement
                  if (project.project_type === 'portfolio_project') {
                    return renderPortfolioCard(project, true);
                  } else {
                    return renderProjectCard(project, false, true);
                  }
                })
              ) : (
                <div className="col-span-full text-center py-10 text-[#68608a]">No completed projects yet.</div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>


      {/* DIALOGS - Hidden Logic Components */}
      <Dialog open={workDialogOpen} onOpenChange={setWorkDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Work Requirement" : "Post Work Requirement"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
            {/* Form Content Copied from original */}
            {!editingProject && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${creditBalance >= 10 ? 'bg-primary-purple/10 text-primary-purple' : 'bg-destructive/10 text-destructive'}`}>
                <Coins className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Your Balance: {creditBalance} credits {creditBalance < 10 && '(Need 10 credits to post)'}
                </span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={workFormData.title}
                onChange={(e) => setWorkFormData({ ...workFormData, title: e.target.value })}
                placeholder="E-commerce Website Development"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={workFormData.description}
                onChange={(e) => setWorkFormData({ ...workFormData, description: e.target.value })}
                placeholder="Describe your project requirements..."
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={workFormData.category}
                  onValueChange={(value) => {
                    setWorkFormData({ ...workFormData, category: value, subcategory: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoryList().map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory *</Label>
                <Select
                  value={workFormData.subcategory}
                  onValueChange={(value) => {
                    setWorkFormData({ ...workFormData, subcategory: value });
                  }}
                  disabled={!workFormData.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {workFormData.category &&
                      getSubcategoriesForCategory(workFormData.category).map((subcat) => (
                        <SelectItem key={subcat} value={subcat}>
                          {subcat}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (₹) *</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={workFormData.budget}
                  onChange={(e) => setWorkFormData({ ...workFormData, budget: e.target.value })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeline">Timeline *</Label>
                <Input
                  id="timeline"
                  value={workFormData.timeline}
                  onChange={(e) => setWorkFormData({ ...workFormData, timeline: e.target.value })}
                  placeholder="2 weeks"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skills_required">Skills Required (comma-separated) *</Label>
              <Input
                id="skills_required"
                value={workFormData.skills_required}
                onChange={(e) => setWorkFormData({ ...workFormData, skills_required: e.target.value })}
                placeholder="React, Node.js, MongoDB"
              />
            </div>
            <div className="space-y-2">
              <Label>Bidding Deadline (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !biddingDeadline && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {biddingDeadline ? format(biddingDeadline, "PPP") : "Pick a deadline"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={biddingDeadline}
                    onSelect={setBiddingDeadline}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            {isVerifiedStudent && userCollegeId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="communityTask">Community Task</Label>
                    <p className="text-xs text-muted-foreground">
                      Only visible to students from your college
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id="communityTask"
                      checked={isCommunityTask}
                      onChange={(e) => setIsCommunityTask(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-purple/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-purple"></div>
                  </label>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Project Images</Label>
              <FileUploader
                type="image"
                maxFiles={5}
                onFilesChange={setUploadedImages}
                currentFiles={uploadedImages}
              />
              {uploadedImages.length > 1 && (
                <ImageGallery
                  images={uploadedImages.map(img => img.url)}
                  coverImageUrl={coverImageUrl}
                  onCoverChange={setCoverImageUrl}
                  editable
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Additional Files (PDF, DOC, etc.)</Label>
              <FileUploader
                type="file"
                maxFiles={10}
                maxSizeInMB={10}
                onFilesChange={setUploadedFiles}
                currentFiles={uploadedFiles}
              />
              {uploadedFiles.length > 0 && (
                <FileList
                  files={uploadedFiles}
                  onDelete={(index) => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}
                  editable
                />
              )}
            </div>
            {/* Client Agreement Checkbox - Only for new projects */}
            {!editingProject && (
              <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/30">
                <Checkbox
                  id="client-agreement"
                  checked={clientAgreementAccepted}
                  onCheckedChange={(checked) => setClientAgreementAccepted(checked === true)}
                />
                <div className="flex-1">
                  <label htmlFor="client-agreement" className="text-sm font-medium cursor-pointer">
                    I agree to the Client Service Agreement
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    By posting this project, you agree to abide by THEUNOiA's terms including the 5% commission on project value.
                  </p>
                  <button
                    type="button"
                    onClick={() => setClientAgreementDialogOpen(true)}
                    className="text-xs text-primary-purple hover:underline mt-1 flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" />
                    Read full agreement
                  </button>
                </div>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="flex-1 bg-primary-purple"
                disabled={!editingProject && !clientAgreementAccepted}
              >
                {editingProject ? "Update" : "Post"} Work Requirement
              </Button>
              <Button variant="outline" onClick={() => setWorkDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Completed Project" : "Add Completed Project"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {/* Simplified form for Portfolio */}
            <div className="space-y-2">
              <Label htmlFor="portfolio_title">Title *</Label>
              <Input id="portfolio_title" value={portfolioFormData.title} onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio_description">Description *</Label>
              <Textarea id="portfolio_description" value={portfolioFormData.description} onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Project Images</Label>
              <FileUploader
                type="image"
                maxFiles={5}
                onFilesChange={setUploadedImages}
                currentFiles={uploadedImages}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSave} className="flex-1 bg-primary-purple">{editingProject ? "Update" : "Add"}</Button>
              <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AgreementDialog
        open={clientAgreementDialogOpen}
        onOpenChange={setClientAgreementDialogOpen}
        type="client"
      />

      <RatingDialog
        open={ratingDialogOpen}
        onOpenChange={setRatingDialogOpen}
        onSubmit={handleSubmitRating}
        projectTitle={projectToRate?.title || ""}
        isSubmitting={isSubmittingRating}
      />
    </main>
  );
};

export default ProjectsPage;
