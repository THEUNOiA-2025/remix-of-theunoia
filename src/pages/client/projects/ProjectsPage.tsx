import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ListFilter,
  Clock,
  Users,
  TrendingUp,
  User,
  Loader2,
  IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Live countdown from now until endDate (ISO string). Updates every second.
function useCountdown(endDate: string | null): { days: number; hours: number; minutes: number } | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!endDate) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endDate]);
  if (!endDate) return null;
  const end = new Date(endDate).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return { days, hours, minutes };
}

function formatCountdown(c: { days: number; hours: number; minutes: number } | null): string {
  if (!c) return "—";
  return `${c.days}d ${c.hours}h ${c.minutes}m`;
}

type ProjectStatus = "open_for_bidding" | "in_progress" | "completed";

interface ClientProject {
  id: string;
  title: string;
  coverImageUrl: string | null;
  coverVideoUrl?: string | null;
  status: ProjectStatus;
  biddingDeadline: string | null;
  bidsReceived: number;
  phaseName: string | null;
  talentName: string | null;
  tags: string[];
  budget: number | null;
}

// Public folder: images (poster/fallback) and all videos from public/Video
const PUBLIC_IMAGES = [
  "/images/class1.png",
  "/images/class2.png",
  "/images/class3.png",
  "/images/auth-slide-1.png",
  "/images/dashboard-hero.png",
  "/images/dashboard-preview.png",
];
import { PROJECT_VIDEOS } from "@/utils/randomVideo";
const PUBLIC_VIDEOS = PROJECT_VIDEOS;

const TABS = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "bidding", label: "Bidding" },
  { value: "completed", label: "Completed" },
] as const;

const ProjectsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]["value"]>("all");
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch client's projects from database
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch projects posted by this client (work_requirement and client_project types)
        const { data: projectsData, error: projectsError } = await supabase
          .from("user_projects")
          .select("*")
          .eq("user_id", user.id)
          .in("project_type", ["work_requirement", "client_project"])
          .order("created_at", { ascending: false });

        if (projectsError) {
          console.error("Error fetching projects:", projectsError);
          setProjects([]);
          return;
        }

        if (!projectsData || projectsData.length === 0) {
          setProjects([]);
          return;
        }

        // Get project IDs
        const projectIds = projectsData.map((p) => p.id);

        // Fetch bid counts for each project
        const { data: bidsData } = await supabase
          .from("bids")
          .select("project_id")
          .in("project_id", projectIds);

        // Count bids per project
        const bidCounts: Record<string, number> = {};
        bidsData?.forEach((bid) => {
          bidCounts[bid.project_id] = (bidCounts[bid.project_id] || 0) + 1;
        });

        // Fetch accepted bids to get freelancer info
        const { data: acceptedBids } = await supabase
          .from("bids")
          .select("project_id, freelancer_id")
          .in("project_id", projectIds)
          .eq("status", "accepted");

        // Get freelancer names for accepted bids
        const freelancerMap: Record<string, string> = {};
        if (acceptedBids && acceptedBids.length > 0) {
          const freelancerIds = [...new Set(acceptedBids.map((b) => b.freelancer_id))];
          const { data: profiles } = await supabase
            .from("user_profiles")
            .select("user_id, first_name, last_name")
            .in("user_id", freelancerIds);

          if (profiles) {
            profiles.forEach((p) => {
              const name = `${p.first_name} ${p.last_name}`.trim() || "Freelancer";
              freelancerMap[p.user_id] = name;
            });
          }

          acceptedBids.forEach((bid) => {
            if (freelancerMap[bid.freelancer_id]) {
              // Store project_id -> freelancer_name mapping
              freelancerMap[`project_${bid.project_id}`] = freelancerMap[bid.freelancer_id];
            }
          });
        }

        // Transform database projects to ClientProject format
        const transformedProjects: ClientProject[] = projectsData.map((p, index) => {
          // Determine status
          let status: ProjectStatus = "open_for_bidding";
          const hasAcceptedBid = acceptedBids?.some((b) => b.project_id === p.id);

          if (p.status === "completed") {
            status = "completed";
          } else if (hasAcceptedBid || p.status === "in_progress") {
            status = "in_progress";
          } else if (p.status === "open") {
            status = "open_for_bidding";
          }

          // Get freelancer name if bid was accepted
          const acceptedBid = acceptedBids?.find((b) => b.project_id === p.id);
          const freelancerName = acceptedBid ? freelancerMap[acceptedBid.freelancer_id] : null;

          return {
            id: p.id,
            title: p.title,
            coverImageUrl: p.cover_image_url || PUBLIC_IMAGES[index % PUBLIC_IMAGES.length],
            coverVideoUrl: PUBLIC_VIDEOS[index % PUBLIC_VIDEOS.length],
            status,
            biddingDeadline: p.bidding_deadline,
            bidsReceived: bidCounts[p.id] || 0,
            phaseName: status === "in_progress" ? "In Progress" : null,
            talentName: freelancerName || null,
            tags: p.skills_required || [],
            budget: p.budget || null,
          };
        });

        setProjects(transformedProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [user?.id]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (activeTab === "all") return true;
      if (activeTab === "active") return p.status === "in_progress";
      if (activeTab === "bidding") return p.status === "open_for_bidding";
      if (activeTab === "completed") return p.status === "completed";
      return true;
    });
  }, [activeTab, projects]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center py-6 px-4 sm:px-6 md:px-8">
      <div className="max-w-[1200px] w-full flex flex-col gap-5">
        {/* Title + Create Task — reduced size */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h1 className="text-[#121118] text-3xl font-black leading-tight tracking-[-0.033em] font-display">
              Projects
            </h1>
            <p className="text-[#68608a] text-base font-medium opacity-80">
              Manage your projects and tasks
            </p>
          </div>
          <Button
            className="flex min-w-[120px] items-center justify-center gap-1.5 rounded-xl h-10 px-4 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95"
            asChild
          >
            <Link to="/projects/post-project">
              <Plus className="w-4 h-4" />
              <span className="truncate">Post Project</span>
            </Link>
          </Button>
        </div>

        {/* Tabs + Filters — compact */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="bg-[#FDF8F3] dark:bg-white/5 p-1 gap-1 h-auto justify-start border border-[#f1f0f5] dark:border-white/10 w-fit rounded-xl shadow-sm flex flex-wrap">
              {TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 text-xs font-bold transition-all duration-200",
                    activeTab === tab.value
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-[#121118] dark:text-white hover:text-primary hover:bg-primary/10"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-[#FDF8F3] dark:bg-white/5 border border-[#f1f0f5] dark:border-white/10 px-3 text-[#121118] dark:text-white text-xs font-medium cursor-pointer hover:bg-[#f1f0f5] dark:hover:bg-white/10 transition-colors"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>
          </div>

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : filteredProjects.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-[#121118] mb-2">No projects yet</h3>
              <p className="text-[#68608a] text-sm mb-4 max-w-md">
                Post your first project and get matched with vetted freelancers
              </p>
              <Button
                className="rounded-xl h-10 px-6 bg-primary text-white text-sm font-bold"
                asChild
              >
                <Link to="/projects/post-project">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Project
                </Link>
              </Button>
            </div>
          ) : (
            /* Project cards grid: 3 per row, reduced gap and card size */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ProjectCard({ project }: { project: ClientProject }) {
  const countdown = useCountdown(
    project.status === "open_for_bidding" ? project.biddingDeadline : null
  );
  const isBidding = project.status === "open_for_bidding";
  const isVideo = Boolean(project.coverVideoUrl);
  const coverSrc = project.coverImageUrl || undefined;

  const statusLabel =
    project.status === "open_for_bidding"
      ? "OPEN FOR BIDDING"
      : project.status === "in_progress"
        ? "IN PROGRESS"
        : "COMPLETED";

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col border border-[#121118]/5">
      {/* Cover: video from public/Video — autoPlay, loop, no controls (same as dashboard Project Overview) */}
      <div className="relative h-36 w-full bg-slate-200 overflow-hidden">
        {isVideo && project.coverVideoUrl ? (
          <>
            <video
              key={project.coverVideoUrl}
              src={encodeURI(project.coverVideoUrl)}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              autoPlay
              muted
              loop
              playsInline
              poster={coverSrc ?? undefined}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </>
        ) : (
          <img
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            src={coverSrc ?? ""}
          />
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-grow">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-[#121118] leading-tight flex-1 min-w-0">
            {project.title}
          </h3>
          <span className="bg-accent text-[#121118] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm shrink-0">
            {statusLabel}
          </span>
        </div>

        {/* Budget display */}
        {project.budget && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#68608a] uppercase tracking-wide">Budget</span>
            <span className="text-sm font-extrabold text-primary">
              ₹{project.budget.toLocaleString()}
            </span>
          </div>
        )}

        {/* Gray container: Ends in + Bids received, or Status + Freelancer */}
        <div className="bg-[#f1f0f5] rounded-lg p-3 flex flex-col gap-2">
          {isBidding ? (
            <>
              <div className="flex items-center justify-between text-[#68608a]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <p className="text-[11px] font-semibold">Bid ends in</p>
                </div>
                <p className="text-[11px] font-bold text-[#121118] tabular-nums">
                  {formatCountdown(countdown)}
                </p>
              </div>
              <div className="flex items-center justify-between text-[#68608a]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  <p className="text-[11px] font-semibold">Bids received</p>
                </div>
                <p className="text-[11px] font-bold text-[#121118]">
                  {project.bidsReceived}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[#68608a]">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-primary" />
                  <p className="text-[11px] font-semibold">Status</p>
                </div>
                <p className="text-[11px] font-bold text-primary">
                  {project.phaseName ?? "—"}
                </p>
              </div>
              <div className="flex items-center justify-between text-[#68608a]">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <p className="text-[11px] font-semibold">Freelancer assigned</p>
                </div>
                <p className="text-[11px] font-bold text-[#121118]">
                  {project.talentName ?? "—"}
                </p>
              </div>
            </>
          )}
        </div>

        <Button
          variant="outline"
          className="w-full h-9 border-2 border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all duration-200 mt-auto"
          asChild
        >
          <Link to={`/projects/${project.id}`}>Open Project</Link>
        </Button>
      </div>
    </div>
  );
}

export default ProjectsPage;
