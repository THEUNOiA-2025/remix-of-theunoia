import { getRandomProjectVideo } from "@/utils/randomVideo";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Camera,
  Star,
  CheckCircle2,
  Clock,
  X,
  Plus,
  Edit,
  Shield,
  Upload,
  GraduationCap,
  ArrowRight,
  MessageSquare,
  Rocket,
  Sparkles,
  CloudUpload,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const ROLE_LABELS: Record<string, string> = {
  student: "Individual Contractor",
  contributor: "Contributor",
  mentor: "Mentor",
};

interface ProfileState {
  firstName: string;
  lastName: string;
  email: string;
  userType: string;
  city: string;
  pinCode: string;
  profilePictureUrl: string;
  bio: string;
  professionalTitle: string;
  bannerUrl: string;
  createdAt: string | null;
  // Financial & Additional Data
  pan?: string | null;
  gstRegistered?: boolean;
  gstin?: string | null;
  gstState?: string | null;
  bankName?: string | null;
  bankAccNumber?: string | null;
  bankIfsc?: string | null;
  upiId?: string | null;
  portfolioLink?: string | null;
}

interface VerificationState {
  verification_status?: string;
  institute_name?: string;
  [key: string]: unknown;
}

interface ProjectItem {
  id: string;
  title: string;
  description?: string;
  image_url?: string | null;
  cover_image_url?: string | null;
  category?: string | null;
  project_type?: string | null;
  rating?: number | null;
  client_feedback?: string | null;
  status?: string | null;
  completed_at?: string | null;
  [key: string]: unknown;
}

interface ReviewItem {
  rating: number;
  feedback?: string | null;
  reviewer_name?: string;
  reviewer_role?: string;
}

const TEXT_PRIMARY = "#121118";
const TEXT_MUTED = "#68608a";

// Development mock data for Skill Bridge Assignments (no backend for now)
const MOCK_ASSIGNMENTS: ProjectItem[] = [
  {
    id: "mock-1",
    title: "UI Design Task",
    description: "Design a modern dashboard interface with responsive layout and accessibility in mind.",
    category: "Design",
    subcategory: "UI/UX",
    cover_image_url: "/images/class1.png",
    status: "in_progress",
    completed_at: null,
    rating: null,
  },
  {
    id: "mock-2",
    title: "Frontend Build",
    description: "Build the main landing page and integrate with the API. React and TypeScript.",
    category: "Development",
    subcategory: "React",
    video_url: getRandomProjectVideo(),
    status: "in_progress",
    completed_at: null,
    rating: 4.9,
  },
  {
    id: "mock-3",
    title: "Dashboard Module",
    description: "Completed dashboard with charts, filters and export. Delivered on time.",
    category: "Development",
    subcategory: "Full Stack",
    video_url: getRandomProjectVideo(),
    status: "completed",
    completed_at: "2025-01-15",
    rating: 4.8,
  },
  {
    id: "mock-4",
    title: "API Integration",
    description: "REST API integration with auth and real-time updates. Client very satisfied.",
    category: "Development",
    subcategory: "Backend",
    video_url: getRandomProjectVideo(),
    status: "completed",
    completed_at: "2025-01-20",
    rating: 5.0,
  },
];

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

const MOCK_PORTFOLIO: PortfolioItem[] = [
  { id: "port-1", title: "HealthTech Mobile App", description: "Conceptual wellness tracking for athletes. Real-time metrics, goal setting, and recovery insights in one clean interface.", image_url: "/images/class1.png" },
  { id: "port-2", title: "Sustainable Brand Identity", description: "Visual identity for an eco-conscious startup. Logo, color system, and key touchpoints for a green tech brand.", image_url: "/images/dashboard-preview.png" },
  { id: "port-3", title: "Dashboard Analytics Module", description: "Custom dashboard with charts, filters and export. Built for a SaaS client to visualize user and revenue metrics.", image_url: "/images/class3.png" },
  { id: "port-4", title: "E‑commerce Checkout Flow", description: "Streamlined checkout and payment UX. Reduced steps and improved conversion for a retail client.", image_url: "/images/dashboard-hero.png" },
];

const PDF_MAX_MB = 15;
const COVER_IMAGE_MAX_MB = 5;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [profile, setProfile] = useState<ProfileState>({
    firstName: "",
    lastName: "",
    email: "",
    userType: "",
    city: "",
    pinCode: "",
    profilePictureUrl: "",
    bio: "",
    professionalTitle: "",
    bannerUrl: "",
    createdAt: null,
  });
  const [verification, setVerification] = useState<VerificationState | null>(null);
  const [isSkillVerified, setIsSkillVerified] = useState(false);
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [rating, setRating] = useState<{ average: number; count: number } | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "in_progress" | "completed">("all");
  const [educationModalOpen, setEducationModalOpen] = useState(false);
  const [educationForm, setEducationForm] = useState({
    institution: "",
    degree: "",
    field: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  /** Education entries added via modal (frontend list; backend can persist later). */
  const [educationList, setEducationList] = useState<Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }>>([]);
  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    coverImageFile: null as File | null,
    pdfFile: null as File | null,
  });
  const [portfolioPdfUploading, setPortfolioPdfUploading] = useState(false);
  const [portfolioDragActive, setPortfolioDragActive] = useState(false);
  const [coverImageDragActive, setCoverImageDragActive] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement | null>(null);
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchVerification();
      fetchSkills();
      fetchProjects();
      fetchRatings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) console.warn("Profile fetch error (e.g. after DB migration):", error);
      const row = data as Record<string, unknown> | null;
      const fromMeta = user?.user_metadata as { firstName?: string; lastName?: string } | undefined;
      if (!row) {
        setProfile((prev) => ({
          ...prev,
          firstName: fromMeta?.firstName ?? prev.firstName ?? "",
          lastName: fromMeta?.lastName ?? prev.lastName ?? "",
        }));
        return;
      }
      setProfile({
        firstName: (row.first_name as string) || "",
        lastName: (row.last_name as string) || "",
        email: (row.email as string) || "",
        userType: (row.user_type as string) || "",
        city: (row.city as string) || "",
        pinCode: (row.pin_code as string) || "",
        profilePictureUrl: (row.profile_picture_url as string) || "",
        bio: (row.bio as string) || "",
        professionalTitle: (row.professional_title as string) || (row.role as string) || "",
        bannerUrl: (user?.id ? localStorage.getItem(BANNER_STORAGE_KEY(user.id)) : null) || "",
        createdAt: (row.created_at as string) || null,
        pan: row.pan as string | null,
        gstRegistered: row.gst_registered as boolean,
        gstin: row.gstin as string | null,
        gstState: row.gst_state as string | null,
        bankName: row.bank_account_name as string | null,
        bankAccNumber: row.bank_account_number as string | null,
        bankIfsc: row.bank_ifsc as string | null,
        upiId: row.upi_id as string | null,
        portfolioLink: row.portfolio_link as string | null,
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    }
  };

  const fetchVerification = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("student_verifications")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      setVerification(data as VerificationState | null);
    } catch (error) {
      console.error("Error fetching verification:", error);
    }
  };

  // Skill verification: no backend yet. When implemented (admin verifies from panel after user submits task),
  // fetch from e.g. skill_verifications and set isSkillVerified(data?.status === "approved").
  // const fetchSkillVerification = async () => { ... };
  // Call fetchSkillVerification in useEffect when ready.

  const SKILLS_STORAGE_KEY = (userId: string) => `profile_role_skills_${userId}`;
  const BANNER_STORAGE_KEY = (userId: string) => `profile_banner_${userId}`;

  const fetchSkills = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_skills")
        .select("skill_name")
        .eq("user_id", user.id);
      if (!error && data?.length) {
        setSkills(data.map((s) => s.skill_name));
        return;
      }
      const raw = localStorage.getItem(SKILLS_STORAGE_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw) as { role?: string; skills?: string[] };
        if (parsed.role) setRole(parsed.role);
        if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      try {
        const raw = localStorage.getItem(SKILLS_STORAGE_KEY(user.id));
        if (raw) {
          const parsed = JSON.parse(raw) as { role?: string; skills?: string[] };
          if (parsed.role) setRole(parsed.role);
          if (Array.isArray(parsed.skills)) setSkills(parsed.skills);
        }
      } catch {
        // ignore
      }
    }
  };

  const fetchProjects = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false });
      if (error) throw error;
      setProjects((data as ProjectItem[]) || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchRatings = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from("freelancer_ratings")
        .select("rating, feedback")
        .eq("freelancer_id", user.id);
      if (error) throw error;
      if (data?.length) {
        const total = data.reduce((sum, r) => sum + (r.rating ?? 0), 0);
        setRating({ average: total / data.length, count: data.length });
        setReviews(
          data.map((r) => ({
            rating: r.rating ?? 0,
            feedback: (r as { feedback?: string }).feedback,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching ratings:", error);
    }
  };

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }
    setUploadingPicture(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);
      await supabase
        .from("user_profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("user_id", user.id);
      toast.success("Profile picture updated!");
      fetchProfile();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ profile_picture_url: null })
        .eq("user_id", user.id);
      if (error) throw error;
      setProfile((prev) => ({ ...prev, profilePictureUrl: "" }));
      toast.success("Profile picture removed");
    } catch {
      toast.error("Could not remove profile picture");
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image");
      return;
    }
    setUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      try {
        localStorage.setItem(BANNER_STORAGE_KEY(user.id), dataUrl);
        setProfile((prev) => ({ ...prev, bannerUrl: dataUrl }));
        toast.success("Banner updated!");
      } catch {
        toast.error("Banner save failed.");
      } finally {
        setUploadingBanner(false);
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read image");
      setUploadingBanner(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const resetPortfolioForm = () => {
    setPortfolioForm({
      title: "",
      description: "",
      coverImageFile: null,
      pdfFile: null,
    });
  };

  const handlePortfolioPdfDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPortfolioDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      if (file.size > PDF_MAX_MB * 1024 * 1024) {
        toast.error(`PDF must be under ${PDF_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, pdfFile: file }));
    } else {
      toast.error("Please upload a PDF file only.");
    }
  };

  const handlePortfolioPdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      if (file.size > PDF_MAX_MB * 1024 * 1024) {
        toast.error(`PDF must be under ${PDF_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, pdfFile: file }));
    } else if (file) {
      toast.error("Please upload a PDF file only.");
    }
    e.target.value = "";
  };

  const handleCoverImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setCoverImageDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > COVER_IMAGE_MAX_MB * 1024 * 1024) {
        toast.error(`Cover image must be under ${COVER_IMAGE_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, coverImageFile: file }));
    } else {
      toast.error("Please upload an image file (JPG, PNG, etc.).");
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      if (file.size > COVER_IMAGE_MAX_MB * 1024 * 1024) {
        toast.error(`Cover image must be under ${COVER_IMAGE_MAX_MB}MB`);
        return;
      }
      setPortfolioForm((f) => ({ ...f, coverImageFile: file }));
    } else if (file) {
      toast.error("Please upload an image file (JPG, PNG, etc.).");
    }
    e.target.value = "";
  };

  const handleSavePortfolio = async () => {
    if (!user?.id) return;
    const { title, description, coverImageFile, pdfFile } = portfolioForm;
    if (!title.trim()) {
      toast.error("Project title is required.");
      return;
    }
    if (!description.trim()) {
      toast.error("Project description is required.");
      return;
    }
    if (!coverImageFile) {
      toast.error("Cover image is required.");
      return;
    }
    if (!pdfFile) {
      toast.error("Portfolio (PDF) is required.");
      return;
    }
    setPortfolioPdfUploading(true);
    try {
      const prefix = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const coverExt = coverImageFile.name.split(".").pop();
      const coverPath = `${prefix}-cover.${coverExt}`;
      const { error: coverError } = await supabase.storage
        .from("project-images")
        .upload(coverPath, coverImageFile);
      if (coverError) throw coverError;
      const { data: { publicUrl: coverUrl } } = supabase.storage.from("project-images").getPublicUrl(coverPath);

      const pdfExt = pdfFile.name.split(".").pop();
      const pdfPath = `${prefix}.${pdfExt}`;
      const { error: pdfError } = await supabase.storage
        .from("project-files")
        .upload(pdfPath, pdfFile);
      if (pdfError) throw pdfError;
      const { data: { publicUrl: pdfUrl } } = supabase.storage.from("project-files").getPublicUrl(pdfPath);

      const { error: insertError } = await supabase.from("user_projects").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        cover_image_url: coverUrl,
        attached_files: [{ name: pdfFile.name, url: pdfUrl, type: pdfFile.type, size: pdfFile.size }],
        project_type: "portfolio_project",
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      if (insertError) throw insertError;
      toast.success("Portfolio project saved.");
      setPortfolioModalOpen(false);
      resetPortfolioForm();
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to save portfolio.");
    } finally {
      setPortfolioPdfUploading(false);
    }
  };

  const roleLabel = (ROLE_LABELS[profile.userType?.toLowerCase()] ?? profile.userType) || "Freelancer";
  const filteredProjects =
    assignmentFilter === "all"
      ? projects
      : assignmentFilter === "completed"
        ? projects.filter((p) => p.status === "completed" || p.completed_at)
        : projects.filter((p) => p.status !== "completed" && !p.completed_at);

  const assignmentsToShow =
    assignmentFilter === "all"
      ? MOCK_ASSIGNMENTS
      : assignmentFilter === "completed"
        ? MOCK_ASSIGNMENTS.filter((p) => p.completed_at)
        : MOCK_ASSIGNMENTS.filter((p) => !p.completed_at);

  const portfolioItems: PortfolioItem[] = (projects as ProjectItem[])
    .filter((p) => p.project_type === "portfolio_project")
    .map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description || "",
      image_url: (p.cover_image_url || p.image_url) || "",
    }));

  const fiveStarCount = reviews.filter((r) => r.rating === 5).length;
  const fourStarCount = reviews.filter((r) => r.rating === 4).length;
  const fiveStarPct = rating?.count ? (fiveStarCount / rating.count) * 100 : 0;
  const fourStarPct = rating?.count ? (fourStarCount / rating.count) * 100 : 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-10 space-y-12">
      {/* —— Add Education History Modal (matches reference 100%) —— */}
      <Dialog open={educationModalOpen} onOpenChange={setEducationModalOpen}>
        <DialogContent
          className="max-w-lg w-full rounded-2xl shadow-2xl border border-gray-200 p-0 gap-0 [&>button]:hidden overflow-hidden bg-white"
        >
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#121118]">Add Education History</h2>
                <p className="text-xs text-[#68608a]">Share your academic background and certifications.</p>
              </div>
            </div>
            <DialogClose className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              const entry = {
                id: `edu-${Date.now()}`,
                institution: educationForm.institution.trim(),
                degree: educationForm.degree.trim(),
                field: educationForm.field.trim(),
                startDate: educationForm.startDate,
                endDate: educationForm.endDate,
                description: educationForm.description.trim(),
              };
              setEducationList((prev) => [...prev, entry]);
              toast.success("Education history added");
              setEducationModalOpen(false);
              setEducationForm({ institution: "", degree: "", field: "", startDate: "", endDate: "", description: "" });
            }}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="institution">
                  Institution Name
                </label>
                <input
                  id="institution"
                  type="text"
                  placeholder="e.g. Stanford University"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm((f) => ({ ...f, institution: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="degree">
                    Degree/Certification
                  </label>
                  <input
                    id="degree"
                    type="text"
                    placeholder="e.g. Bachelor of Science"
                    value={educationForm.degree}
                    onChange={(e) => setEducationForm((f) => ({ ...f, degree: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="field">
                    Field of Study
                  </label>
                  <input
                    id="field"
                    type="text"
                    placeholder="e.g. Product Design"
                    value={educationForm.field}
                    onChange={(e) => setEducationForm((f) => ({ ...f, field: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="start-date">
                    Start Date
                  </label>
                  <input
                    id="start-date"
                    type="month"
                    value={educationForm.startDate}
                    onChange={(e) => setEducationForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="end-date">
                    End Date (or Expected)
                  </label>
                  <input
                    id="end-date"
                    type="month"
                    value={educationForm.endDate}
                    onChange={(e) => setEducationForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="description">
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  rows={2}
                  placeholder="Key focus areas, achievements, or research..."
                  value={educationForm.description}
                  onChange={(e) => setEducationForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 resize-y"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                className="px-4 py-2 text-xs font-bold text-[#68608a] hover:text-[#121118]"
                onClick={() => setEducationModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:opacity-95 transition-all shadow-lg shadow-primary/25"
              >
                Add Education History
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* —— Upload Portfolio Project Modal (same size as Education modal) —— */}
      <Dialog open={portfolioModalOpen} onOpenChange={(open) => { setPortfolioModalOpen(open); if (!open) resetPortfolioForm(); }}>
        <DialogContent
          className="max-w-lg w-full rounded-2xl shadow-2xl border border-gray-200 p-0 gap-0 [&>button]:hidden overflow-hidden bg-white"
        >
          <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-[#121118]">Upload Portfolio Project</h2>
              <p className="text-xs text-[#68608a] mt-1">Add a project with cover image and PDF.</p>
            </div>
            <DialogClose className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#e2e2e2] [&::-webkit-scrollbar-thumb]:rounded-full">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="portfolio-title">
                  Project Title <span className="text-primary">*</span>
                </label>
                <input
                  id="portfolio-title"
                  type="text"
                  placeholder="e.g. Modern E-commerce Dashboard"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1" htmlFor="portfolio-description">
                  Project Description <span className="text-primary">*</span>
                </label>
                <textarea
                  id="portfolio-description"
                  placeholder="Describe your process and the problem you solved..."
                  rows={3}
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[#f8f7fa] border-none rounded-lg text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-gray-400 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">
                  Cover Image <span className="text-primary">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${coverImageDragActive ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  onDragEnter={(e) => { e.preventDefault(); setCoverImageDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setCoverImageDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleCoverImageDrop}
                  onClick={() => coverImageInputRef.current?.click()}
                >
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageChange}
                  />
                  <CloudUpload className="h-7 w-7 text-primary mb-2" />
                  <p className="text-xs font-medium text-[#121118]">Drag & drop or click</p>
                  <p className="text-xs text-[#68608a] mt-0.5">Image only (Max {COVER_IMAGE_MAX_MB}MB)</p>
                  {portfolioForm.coverImageFile && (
                    <p className="mt-2 text-xs text-primary font-medium truncate max-w-full">{portfolioForm.coverImageFile.name}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#121118] mb-1">
                  Upload Portfolio (PDF) <span className="text-primary">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${portfolioDragActive ? "border-primary/50 bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  onDragEnter={(e) => { e.preventDefault(); setPortfolioDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setPortfolioDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handlePortfolioPdfDrop}
                  onClick={() => portfolioFileInputRef.current?.click()}
                >
                  <input
                    ref={portfolioFileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePortfolioPdfChange}
                  />
                  <FileText className="h-7 w-7 text-primary mb-2" />
                  <p className="text-xs font-medium text-[#121118]">PDF only (Max {PDF_MAX_MB}MB)</p>
                  {portfolioForm.pdfFile && (
                    <p className="mt-2 text-xs text-primary font-medium truncate max-w-full">{portfolioForm.pdfFile.name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="px-6 pt-4 pb-6 border-t border-gray-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              className="px-4 py-2 text-xs font-bold text-[#68608a] hover:text-[#121118]"
              onClick={() => { setPortfolioModalOpen(false); resetPortfolioForm(); }}
            >
              Discard
            </Button>
            <Button
              type="button"
              className="px-6 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:opacity-95 transition-all shadow-lg shadow-primary/25 flex items-center gap-2"
              onClick={handleSavePortfolio}
              disabled={portfolioPdfUploading}
            >
              {portfolioPdfUploading ? "Saving…" : "Save to Portfolio"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* —— Identity Hero: Banner + Card —— */}
      <section className="rounded-2xl overflow-hidden shadow-sm border border-[#f1f0f5] bg-white relative">
        {/* LinkedIn-style banner */}
        <label className="block relative h-40 sm:h-48 cursor-pointer group">
          {profile.bannerUrl ? (
            <img
              src={profile.bannerUrl}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full bg-primary/10 flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.1) 100%)" }}
            />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium flex items-center gap-2">
              <Camera className="h-4 w-4" /> Change cover
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerUpload}
            disabled={uploadingBanner}
          />
        </label>

        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative px-6 pt-4 py-6 pb-12 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="relative -mt-40 shrink-0">
            <Avatar className="size-28 md:size-32 rounded-full border-3 border-white shadow-lg bg-white ring-2 ring-white">
              <AvatarImage src={profile.profilePictureUrl} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                {profile.firstName[0]}
                {profile.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-picture"
              className="absolute inset-0 rounded-full cursor-pointer flex items-center justify-center"
            >
              {!profile.profilePictureUrl && !uploadingPicture && (
                <span
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-2 ring-white hover:bg-primary/90"
                  title="Add photo"
                >
                  <Plus className="h-5 w-5" />
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                <Camera className="h-7 w-7 text-white" />
              </span>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureUpload}
                disabled={uploadingPicture}
              />
            </label>
            {profile.profilePictureUrl && !uploadingPicture && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveProfilePicture();
                }}
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-2 ring-white hover:bg-red-600"
                title="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {uploadingPicture && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full pointer-events-none">
                <div className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center md:text-left min-w-0">
            {/* Row 1: Name + Verified badge (or Not verified + Verify) next to each other */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <h1 className="text-2xl font-extrabold" style={{ color: TEXT_PRIMARY }}>
                {profile.firstName} {profile.lastName}
              </h1>
              {verification?.verification_status === "approved" ? (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full"
                  style={{ backgroundColor: "hsl(var(--accent))", color: "#2d4a22" }}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </span>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-800">
                    Not verified
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs rounded-lg border-primary/40 text-primary hover:bg-primary/10"
                    onClick={() => navigate("/profile/verify")}
                  >
                    Verify
                  </Button>
                </>
              )}
            </div>

            {/* Row 2: Individual Contractor only */}
            <div className="mb-2">
              <span
                className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider"
                style={{ backgroundColor: "hsl(var(--accent))", color: "#2d4a22" }}
              >
                {roleLabel}
              </span>
            </div>

            {/* Row 3: Role and skills */}
            {(role || skills.length > 0) ? (
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 mb-2 text-sm" style={{ color: TEXT_MUTED }}>
                {role && (
                  <span>
                    <span className="font-medium">Role:</span>{" "}
                    <span style={{ color: TEXT_PRIMARY }}>{role}</span>
                  </span>
                )}
                {skills.length > 0 && (
                  <span>
                    <span className="font-medium">Skills:</span>{" "}
                    <span style={{ color: TEXT_PRIMARY }}>{skills.join(", ")}</span>
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs mb-2" style={{ color: TEXT_MUTED }}>
                Add role and skills in Edit Profile for job matching
              </p>
            )}

            {/* Row 4: Description (bio) */}
            {profile.bio && (
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                {profile.bio}
              </p>
            )}
            {profile.professionalTitle && !profile.bio && (
              <p className="text-sm" style={{ color: TEXT_MUTED }}>
                {profile.professionalTitle}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-sm font-semibold bg-[#f1f0f5] border-0 hover:bg-gray-200 flex items-center justify-center gap-1.5"
              onClick={() => navigate("/profile/edit")}
            >
              <Edit className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button
              size="sm"
              className="rounded-lg text-sm font-semibold bg-primary text-primary-foreground shadow-md hover:opacity-90 flex items-center justify-center gap-1.5"
              onClick={() => setPortfolioModalOpen(true)}
            >
              <Upload className="h-3.5 w-3.5" /> Portfolio
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-sm font-semibold border-2 border-primary/20 text-primary hover:bg-primary/5 flex items-center justify-center gap-1.5"
              onClick={() => setEducationModalOpen(true)}
            >
              <GraduationCap className="h-3.5 w-3.5" /> Education
            </Button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* —— Left: Verification & Certificates —— */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Skill Verification: backend not yet implemented. When ready, admin verifies from panel → show Skill verified. */}
          <div>
            <h3 className="text-base font-bold mb-2 flex items-center gap-1.5" style={{ color: TEXT_PRIMARY }}>
              <Shield className="h-4 w-4 text-primary" />
              Skill Verification
            </h3>
            <div className="bg-white p-4 rounded-xl border border-[#f1f0f5] shadow-sm overflow-hidden relative group">
              <div className="absolute -right-2 -bottom-2 opacity-10 text-primary">
                <Shield className="h-20 w-20" />
              </div>
              <h4 className="text-sm font-bold mb-2" style={{ color: TEXT_PRIMARY }}>
                Verified Talent
              </h4>
              {isSkillVerified ? (
                <>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: TEXT_MUTED }}>
                    Your skills have been verified by THEUNOiA mentors. You have full access to premium client assignments.
                  </p>
                  <div
                    className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg gap-1.5"
                    style={{ backgroundColor: "hsl(var(--accent))", color: "#2d4a22" }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Skill verified
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs mb-3 leading-relaxed" style={{ color: TEXT_MUTED }}>
                    Your skills have not been verified by THEUNOiA mentors. In order to have full access to premium client assignments, please verify your skills.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 text-amber-800">
                      Skill not verified
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs rounded-lg border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => navigate("/profile/verify")}
                    >
                      Verify
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold" style={{ color: TEXT_PRIMARY }}>
                Certificates
              </h3>
              <button
                type="button"
                className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
              >
                View All <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#f1f0f5] shadow-sm">
              <p className="text-sm text-center" style={{ color: TEXT_MUTED }}>
                Class Feature will come soon
              </p>
            </div>
          </div>
        </aside>

        {/* —— Right: Assignments & Portfolio & Additional Details —— */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-6 rounded-xl border border-[#f1f0f5]">
            <h3 className="text-lg font-bold mb-4" style={{ color: TEXT_PRIMARY }}>
              Financial & Additonal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <span className="block font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>PAN Number</span>
                {profile.pan ? (
                  <span style={{ color: TEXT_MUTED }}>{profile.pan}</span>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 uppercase text-[10px] tracking-wider">Incomplete</Badge>
                )}
              </div>
              <div>
                <span className="block font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>GST Registered</span>
                {profile.gstRegistered ? (
                  <span style={{ color: TEXT_MUTED }}>Yes {profile.gstin ? `(${profile.gstin})` : ""}</span>
                ) : (
                  <span style={{ color: TEXT_MUTED }}>No</span>
                )}
              </div>
              <div>
                <span className="block font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>Payout Method</span>
                {(profile.bankAccNumber || profile.upiId) ? (
                  <span style={{ color: TEXT_MUTED }}>
                    {profile.bankAccNumber ? "Bank Account" : "UPI"} Provided
                  </span>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 uppercase text-[10px] tracking-wider">Incomplete</Badge>
                )}
              </div>
              <div>
                <span className="block font-semibold mb-1" style={{ color: TEXT_PRIMARY }}>Portfolio Link</span>
                {profile.portfolioLink ? (
                  <a href={profile.portfolioLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline line-clamp-1 break-all">
                    {profile.portfolioLink}
                  </a>
                ) : (
                  <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-200 uppercase text-[10px] tracking-wider">Incomplete</Badge>
                )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
                Skill Bridge Assignments
              </h3>
              <div className="flex bg-white p-0.5 rounded-lg shadow-sm border border-[#f1f0f5]">
                {(["all", "in_progress", "completed"] as const).map((key: "all" | "in_progress" | "completed") => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAssignmentFilter(key)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${assignmentFilter === key
                      ? "bg-primary text-white"
                      : "text-[#68608a] hover:bg-gray-100"
                      }`}
                  >
                    {key === "all" ? "All" : key === "completed" ? "Completed" : "In Progress"}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {assignmentsToShow.length > 0 ? (
                assignmentsToShow.map((project) => (
                  <div
                    key={project.id}
                    className="group bg-white rounded-xl border border-[#f1f0f5] hover:border-primary/30 transition-all overflow-hidden flex flex-col sm:flex-row"
                  >
                    {/* Left: cover image or video (rectangle) */}
                    <div className="w-full sm:w-48 shrink-0 aspect-video bg-[#f1f0f5] relative">
                      {project.video_url ? (
                        <video
                          src={encodeURI(String(project.video_url))}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      ) : (project.cover_image_url || project.image_url) ? (
                        <img
                          src={(project.cover_image_url || project.image_url) as string}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {project.completed_at ? (
                            <Rocket className="h-10 w-10 text-primary/50" />
                          ) : (
                            <Sparkles className="h-10 w-10 text-primary/50" />
                          )}
                        </div>
                      )}
                    </div>
                    {/* Right: title, description, category, subcategory, ratings (only if completed) */}
                    <div className="flex-1 min-w-0 p-4 flex flex-col justify-center">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="text-sm font-bold group-hover:text-primary transition-colors" style={{ color: TEXT_PRIMARY }}>
                          {project.title}
                        </h4>
                        <span
                          className={`inline-flex shrink-0 items-center px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${project.completed_at
                            ? "bg-accent/20 text-[#2d4a22]"
                            : "bg-primary/10 text-primary"
                            }`}
                        >
                          {project.completed_at ? "Completed" : "In Progress"}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-xs line-clamp-2 mb-2" style={{ color: TEXT_MUTED }}>
                          {project.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {project.category && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded" style={{ color: TEXT_PRIMARY }}>
                            {project.category}
                          </span>
                        )}
                        {project.subcategory != null && project.subcategory !== "" && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded" style={{ color: TEXT_MUTED }}>
                            {(project.subcategory as string)}
                          </span>
                        )}
                      </div>
                      {project.completed_at && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${(project.rating ?? 0) >= i
                                  ? "fill-secondary text-secondary"
                                  : "text-gray-300"
                                  }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-medium" style={{ color: TEXT_MUTED }}>
                            {(project.rating ?? 0) > 0 ? `${project.rating}.0` : "—"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 rounded-xl border border-[#f1f0f5] text-center text-sm" style={{ color: TEXT_MUTED }}>
                  No assignments yet.
                </div>
              )}
            </div>
          </section>

        </div>
      </div>

      {/* —— Independent Portfolio: full width, 4 per row, cover → title → description —— */}
      <section className="w-full mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold" style={{ color: TEXT_PRIMARY }}>
            Independent Portfolio
          </h3>
          <Link
            to="/profile/portfolio"
            className="text-primary text-sm font-bold flex items-center gap-1 hover:underline"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sample data until backend is ready; replace with portfolioItems when ready */}
          {MOCK_PORTFOLIO.slice(0, 4).map((item) => (
            <div key={item.id} className="group cursor-pointer">
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full aspect-video object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300"
              />
              <h5 className="font-bold text-sm mt-2" style={{ color: TEXT_PRIMARY }}>
                {item.title}
              </h5>
              <p className="text-xs leading-relaxed line-clamp-3 mt-0.5" style={{ color: TEXT_MUTED }}>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* —— Footer: Education & Ratings —— */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-[#f1f0f5]">
        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: TEXT_PRIMARY }}>
            Education History
          </h3>
          <div className="relative pl-6 space-y-6 before:absolute before:left-[9px] before:top-1 before:bottom-1 before:w-[2px] before:bg-gray-200">
            {educationList.length === 0 && !verification?.institute_name && (
              <div className="relative">
                <div className="absolute -left-5 top-1 size-3 rounded-full bg-gray-300 border-2 border-white z-10" />
                <h5 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>
                  Education
                </h5>
                <p className="text-xs text-primary font-medium mb-1">Add in Edit Profile</p>
                <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                  Focus on your degree and certifications. Use the Education button above to add entries.
                </p>
              </div>
            )}
            {verification?.institute_name && (
              <div className="relative">
                <div className="absolute -left-5 top-1 size-3 rounded-full bg-primary border-2 border-white z-10" />
                <h5 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>
                  {verification.institute_name}
                </h5>
                <p className="text-xs text-primary font-medium mb-1">Student • THEUNOiA</p>
                <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                  Focus on your degree and certifications.
                </p>
              </div>
            )}
            {[...educationList]
              .sort((a, b) => {
                // Timeline ascending: oldest first (small date → first). No date = end of list.
                const aStart = a.startDate || "9999-12";
                const bStart = b.startDate || "9999-12";
                if (aStart !== bStart) return aStart.localeCompare(bStart);
                const aEnd = a.endDate || "9999-12";
                const bEnd = b.endDate || "9999-12";
                return aEnd.localeCompare(bEnd);
              })
              .map((edu) => (
                <div key={edu.id} className="relative">
                  <div className="absolute -left-5 top-1 size-3 rounded-full bg-primary border-2 border-white z-10" />
                  <h5 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>
                    {edu.institution || "Institution"}
                  </h5>
                  <p className="text-xs text-primary font-medium mb-1">
                    {[edu.degree, edu.field].filter(Boolean).join(" • ") || "—"}
                    {edu.startDate || edu.endDate ? ` • ${edu.startDate || "—"} – ${edu.endDate || "Present"}` : ""}
                  </p>
                  {edu.description ? (
                    <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                      {edu.description}
                    </p>
                  ) : null}
                </div>
              ))}
            <div className="relative">
              <div className="absolute -left-5 top-1 size-3 rounded-full bg-gray-300 border-2 border-white z-10" />
              <h5 className="text-sm font-bold" style={{ color: TEXT_PRIMARY }}>
                THEUNOiA Design Fellowship
              </h5>
              <p className="text-xs text-primary font-medium mb-1">
                Advanced UI/UX Certification • 2023
              </p>
              <p className="text-xs leading-relaxed" style={{ color: TEXT_MUTED }}>
                Immersive program focusing on high-fidelity prototyping and design tokens.
              </p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-4" style={{ color: TEXT_PRIMARY }}>
            Ratings & Reviews
          </h3>
          <div className="flex items-center gap-4 mb-4 p-4 bg-white rounded-xl border border-[#f1f0f5]">
            <div className="text-center">
              <div className="text-3xl font-extrabold" style={{ color: TEXT_PRIMARY }}>
                {rating ? rating.average.toFixed(1) : "—"}
              </div>
              <div className="flex text-secondary justify-center mt-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${rating && Math.round(rating.average) >= i
                      ? "fill-secondary text-secondary"
                      : "text-gray-300"
                      }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3].map((star) => (
                <div key={star} className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold w-3">{star}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width:
                          star === 5
                            ? `${fiveStarPct}%`
                            : star === 4
                              ? `${fourStarPct}%`
                              : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {reviews.filter((r) => r.feedback).slice(0, 2).map((r, i) => (
              <div
                key={i}
                className="p-3 bg-white rounded-lg border border-[#f1f0f5] italic text-xs"
              >
                <p className="mb-2" style={{ color: TEXT_MUTED }}>
                  "{r.feedback}"
                </p>
                <div className="flex items-center gap-2">
                  <div className="size-4 rounded-full bg-gray-200" />
                  <span className="font-bold text-[10px] not-italic" style={{ color: TEXT_PRIMARY }}>
                    Mentor / Client
                  </span>
                </div>
              </div>
            ))}
            {reviews.filter((r) => r.feedback).length === 0 && (
              <p className="text-xs" style={{ color: TEXT_MUTED }}>
                No written reviews yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
