import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Building2,
  FileText,
  ArrowRight,
  Calendar,
  CalendarDays,
  HeadphonesIcon,
  Check,
  AlertCircle,
  Folder,
  Clock,
  CheckCircle2,
  Activity,
  ExternalLink,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectService } from "@/services/projectService";
import { BidService } from "@/services/bidService";
import { InvoiceService } from "@/services/invoiceService";
import { ProjectTrackingService } from "@/services/ProjectTrackingService";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

// Performance analytics per project (calculated from real data).
interface PerfMetrics {
  totalTasks: number;
  inProgress: number;
  completed: number;
  overdue: number;
  phasesCompleted: number;
  totalPhases: number;
  activePhaseNumber: number;
  activePhaseName: string;
  lastActivity: string;
}

// Tasks completed per week (velocity): x = week label, y = count


const DashboardPage = () => {
  const { user } = useAuth();
  const [projectIndex, setProjectIndex] = useState(0);
  const [metricsProjectIndex, setMetricsProjectIndex] = useState(0);

  // Fetch User Profile
  const { data: profile } = useQuery({
    queryKey: ['client-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch Active Projects (Client's projects in progress or open)
  const { data: activeProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ['client-active-projects', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get In Progress Projects
      const workingProjects = await ProjectService.getWorkingProjects(user.id, 'client') || [];

      // Get Open Projects (also relevant for client dashboards to see what's being bid on)
      const { data: openProjects, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Combine and return
      return [...workingProjects, ...(openProjects || [])];
    },
    enabled: !!user?.id,
  });

  // Fetch Action Items (Pending Bids on Open Projects)
  const { data: actionItems = [] } = useQuery({
    queryKey: ['client-action-items', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const actions: { id: string; label: string; variant: "primary" | "secondary" | "accent"; link?: string }[] = [];

      // 1. Check for pending bids on open projects
      const { data: openProjects } = await supabase
        .from("user_projects")
        .select("id, title")
        .eq("user_id", user.id)
        .eq("status", "open");

      if (openProjects && openProjects.length > 0) {
        for (const project of openProjects) {
          const bids = await BidService.getProjectBids(project.id);
          // Count pending bids
          const pendingBids = (bids || []).filter((b: any) => b.status === "pending");

          if (pendingBids.length > 0) {
            actions.push({
              id: `bids-${project.id}`,
              label: `${pendingBids.length} Bid${pendingBids.length > 1 ? 's' : ''} on "${project.title}"`,
              variant: "primary",
              link: `/projects/${project.id}`
            });
          }
        }
      }

      // 2. Fetch Pending Invoices
      const invoices = await InvoiceService.getInvoices(user.id, 'client');
      const pendingInvoices = (invoices || []).filter((inv: any) => inv.status === 'pending' || inv.status === 'overdue');

      if (pendingInvoices.length > 0) {
        actions.push({
          id: 'pending-invoices',
          label: `${pendingInvoices.length} Pending Invoice${pendingInvoices.length > 1 ? 's' : ''}`,
          variant: "accent", // Orange/Amber for financial actions
          link: "/invoices" // Assuming an invoices page exists or anchor
        });
      }

      // 3. Fetch Unread Messages
      // Find conversations where I am the client
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', user.id);

      let unreadCount = 0;
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
          .neq('sender_id', user.id) // Message not from me
          .eq('is_read', false); // Message is unread

        unreadCount = count || 0;
      }

      if (unreadCount > 0) {
        actions.push({
          id: 'msgs',
          label: `${unreadCount} Unread Message${unreadCount !== 1 ? 's' : ''}`,
          variant: "accent",
          link: "/messages"
        });
      }

      // 4. Fetch Pending Phase Approvals and Completion Requests
      const { data: activeProjects } = await supabase
        .from("user_projects")
        .select("id, title, status")
        .eq("user_id", user.id)
        .in("status", ["in_progress", "completion_requested"]);

      if (activeProjects && activeProjects.length > 0) {
        for (const project of activeProjects) {
          // Check for Project Completion Request
          if (project.status === 'completion_requested') {
            actions.push({
              id: `completion-${project.id}`,
              label: `Completion Request for "${project.title}"`,
              variant: "primary",
              link: `/projects/${project.id}`
            });
            continue; // Skip phase check if completion is requested (usually implies phases are done)
          }

          // Check for Phase Approvals
          try {
            const phases = await ProjectTrackingService.getPhaseStates(project.id);
            // Submit condition: freelancer_approved = true, client_approved = false
            const pendingPhases = phases.filter(p => p.freelancer_approved && !p.client_approved);

            if (pendingPhases.length > 0) {
              actions.push({
                id: `phase-approval-${project.id}`,
                label: `${pendingPhases.length} Phase Approval${pendingPhases.length > 1 ? 's' : ''} Pending for "${project.title}"`,
                variant: "secondary", // Distinct color for phase approvals
                link: `/projects/${project.id}?tab=tracking`
              });
            }
          } catch (e) {
            console.error(`Error checking phases for ${project.id}`, e);
          }
        }
      }

      return actions;
    },
    enabled: !!user?.id,
  });

  // Fetch Invoices
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['client-invoices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await InvoiceService.getInvoices(user.id, 'client');
    },
    enabled: !!user?.id,
  });

  const currentProject = activeProjects[projectIndex];

  // Helper to safely get project progress (if not present, default to 0)
  const getProjectProgress = (project: any) => {
    if (!project) return 0;
    // Logic could be enhanced if 'progress' field is added to DB
    // For now, mapping status to progress percentage
    if (project.status === 'completed') return 100;
    if (project.status === 'in_progress') return 50; // Placeholder
    return 0; // Open
  };



  // Fetch Project Tracking Data
  const { data: trackingData, isLoading: isLoadingTracking } = useQuery({
    queryKey: ['project-tracking-data', currentProject?.id],
    queryFn: async () => {
      if (!currentProject?.id) return null;
      try {
        const [tasks, phases, activities] = await Promise.all([
          ProjectTrackingService.getTasks(currentProject.id),
          ProjectTrackingService.getPhaseStates(currentProject.id),
          ProjectTrackingService.getActivities(currentProject.id)
        ]);
        return { tasks, phases, activities };
      } catch (error) {
        console.error("Error fetching project tracking data:", error);
        return null;
      }
    },
    enabled: !!currentProject?.id,
  });

  // Calculate real metrics
  const currentMetrics = useMemo((): PerfMetrics | null => {
    if (!currentProject || !trackingData) return null;

    const { tasks, phases, activities } = trackingData;

    const totalTasks = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done') return false;
      return new Date(t.deadline) < new Date();
    }).length;

    const totalPhases = phases.length;
    const phasesCompleted = phases.filter(p => p.status === 'locked').length; // locked means completed

    // Find active phase
    const activePhaseObj = phases.find(p => p.status === 'active');
    const activePhaseNumber = activePhaseObj ? activePhaseObj.phase_order :
      (phasesCompleted === totalPhases ? totalPhases : 1);
    const activePhaseName = activePhaseObj ? activePhaseObj.phase_name :
      (phasesCompleted === totalPhases ? "Completed" : "Not Started");

    const lastActivity = activities.length > 0
      ? format(new Date(activities[0].timestamp), 'MMM d, yyyy')
      : format(new Date(currentProject.created_at), 'MMM d, yyyy');

    return {
      totalTasks,
      inProgress,
      completed,
      overdue,
      phasesCompleted,
      totalPhases,
      activePhaseNumber,
      activePhaseName,
      lastActivity
    };
  }, [currentProject, trackingData]);

  // Execute calculating progress based on tasks if available, else fallback
  const projectProgress = useMemo(() => {
    if (!currentProject) return 0;
    if (!trackingData || !trackingData.tasks || trackingData.tasks.length === 0) {
      return getProjectProgress(currentProject);
    }
    const { tasks } = trackingData;
    const completed = tasks.filter((t: any) => t.status === 'done').length;
    return Math.round((completed / tasks.length) * 100);
  }, [trackingData, currentProject]);

  return (
    <div className="w-full py-3">
      {/* Client profile header */}
      <section className="mb-3 flex flex-col md:flex-row justify-between items-start md:items-center bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
        <div className="flex gap-3 items-center">
          <div className="bg-white p-2 rounded-lg shadow-inner border border-black/5 flex items-center justify-center size-12">
            {profile?.profile_picture_url ? (
              <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover rounded-md" />
            ) : (
              <Building2 className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-[#121118] dark:text-white text-lg font-extrabold tracking-tight">
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p className="text-[#68608a] dark:text-gray-400 text-sm font-medium mt-0.5">
              {profile?.website || "Client Account"}
            </p>
          </div>
        </div>
        <div className="mt-3 md:mt-0 space-y-1 text-right">
          <div className="flex items-center justify-end gap-1.5 text-[#68608a] dark:text-gray-300">
            <Mail className="w-3.5 h-3.5" />
            <span className="text-xs">{profile?.email || user?.email}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Contract: Active
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-[#68608a] dark:text-gray-300">
            <span className="text-xs">
              Account Manager: <span className="font-semibold text-primary">Sarah Jenkins</span>
            </span>
            <HeadphonesIcon className="w-3.5 h-3.5" />
          </div>
        </div>
      </section>

      {/* Row 1: Project Overview + Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        {/* Project Overview */}
        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[#121118] dark:text-white text-base font-bold">
              Project Overview
            </h3>
            {activeProjects.length > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary p-0.5 rounded-md">
                <button
                  type="button"
                  onClick={() =>
                    setProjectIndex((i) => (i === 0 ? activeProjects.length - 1 : i - 1))
                  }
                  className="p-0.5 hover:opacity-80 rounded transition-opacity"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-secondary-foreground" />
                </button>
                <span className="text-[10px] font-bold text-secondary-foreground px-1.5 whitespace-nowrap">
                  Project {projectIndex + 1} of {activeProjects.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProjectIndex((i) => (i === activeProjects.length - 1 ? 0 : i + 1))
                  }
                  className="p-0.5 hover:opacity-80 rounded transition-opacity"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-secondary-foreground" />
                </button>
              </div>
            )}
          </div>

          {activeProjects.length > 0 && currentProject ? (
            <div className="flex-1 space-y-2">
              <div className="relative w-full aspect-video rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 border border-black/5 group">
                {currentProject.cover_image_url ? (
                  <img
                    src={currentProject.cover_image_url}
                    alt={currentProject.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <Folder className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              </div>
              <div>
                <h4 className="text-[#121118] dark:text-white text-sm font-bold">
                  {currentProject.title}
                </h4>
                <p className="text-[#68608a] dark:text-gray-400 text-[10px] mt-0.5">
                  Deadline: {currentProject.bidding_deadline ? format(new Date(currentProject.bidding_deadline), 'MMM d, yyyy') : 'No deadline'}
                </p>
              </div>
              <div className="space-y-1 pt-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-primary">
                    {projectProgress}% Complete
                  </span>
                  <span className="text-[10px] font-medium text-[#68608a]">
                    {currentProject.status === 'open' ? 'Bidding Phase' : 'Execution Phase'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#f1f0f5] dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(126,99,248,0.4)]"
                    style={{ width: `${projectProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-5">
              <p className="text-sm text-gray-500 mb-2">No active projects found.</p>
              <Link to="/projects/post-project">
                <Button size="sm">Post a Project</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5 flex flex-col min-h-0">
          {/* ... Header for Metrics (Simplified) ... */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[#121118] dark:text-white text-base font-bold">
              Performance Metrics
            </h3>
          </div>

          {isLoadingTracking ? (
            <div className="flex-1 flex flex-col gap-4 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
              <div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
                  ))}
                </div>
              </div>
              <div className="h-px bg-gray-200 dark:bg-gray-700 my-1"></div>
              <div className="flex items-center gap-2">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-40"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex-1"></div>
              </div>
            </div>
          ) : currentMetrics ? (
            (() => {
              const pm = currentMetrics;
              const proj = currentProject;
              const projectTitle = proj?.title ?? "Project";
              const onTrack = pm.overdue === 0;
              const toDo = Math.max(0, pm.totalTasks - pm.inProgress - pm.completed);
              const statusBars = [
                { label: "To do", value: toDo, color: "bg-accent" },
                { label: "In progress", value: pm.inProgress, color: "bg-secondary" },
                { label: "Done", value: pm.completed, color: "bg-primary" },
              ];
              const phaseNum = pm.activePhaseNumber ?? 1;
              const phaseName = pm.activePhaseName ?? "—";

              return (
                <div className="flex flex-col flex-1 min-h-0 gap-4">
                  {/* Project title | On track (accent/green) | 3 of 5 phases completed */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-[#121118] dark:text-white truncate">
                      {projectTitle}
                    </h4>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {onTrack ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/50 text-accent-foreground">
                          <Check className="w-3 h-3" />
                          On track
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <AlertCircle className="w-3 h-3" />
                          At risk
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary/50 text-secondary-foreground">
                        {pm.phasesCompleted} of {pm.totalPhases} phases completed
                      </span>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="flex flex-col md:flex-row gap-4 h-64 mt-2">
                    {/* Pie Chart: Task Status */}
                    <div className="flex-1 flex flex-col items-center justify-center relative">
                      <h5 className="text-xs font-bold text-[#121118] dark:text-white mb-2 self-start w-full">Task status</h5>
                      <div className="w-full h-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: 'To do', value: toDo, color: '#8b5cf6' },
                                { name: 'In progress', value: pm.inProgress, color: '#f59e0b' },
                                { name: 'Done', value: pm.completed, color: '#10b981' },
                              ].filter(i => i.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {[
                                { name: 'To do', value: toDo, color: '#8b5cf6' },
                                { name: 'In progress', value: pm.inProgress, color: '#f59e0b' },
                                { name: 'Done', value: pm.completed, color: '#10b981' },
                              ].filter(i => i.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: number) => [value, 'Tasks']}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#121118] dark:text-white block">{pm.totalTasks}</span>
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tasks</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-center mt-2">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div>
                          <span className="text-[10px] text-gray-600 font-bold">To do {toDo}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                          <span className="text-[10px] text-gray-600 font-bold">In progress {pm.inProgress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                          <span className="text-[10px] text-gray-600 font-bold">Done {pm.completed}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bar Chart: Tasks Completed Per Day */}
                    <div className="flex-[1.5] w-full min-w-0">
                      <h5 className="text-xs font-bold text-[#121118] dark:text-white mb-2">Tasks completed per day</h5>
                      <div className="w-full h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={(() => {
                              const currentTasks = trackingData?.tasks || [];
                              const dayCounts = new Array(7).fill(0);
                              const now = new Date();
                              const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                              const last7DaysLabels = new Array(7).fill('');

                              // Initialize labels for last 7 days
                              for (let i = 6; i >= 0; i--) {
                                const d = new Date(now);
                                d.setDate(d.getDate() - i);
                                last7DaysLabels[6 - i] = days[d.getDay()];
                              }

                              // Group actual completed tasks by day
                              const completedTasks = currentTasks.filter(t => t.status === 'done' && t.updatedAt);

                              completedTasks.forEach(t => {
                                const doneDate = new Date(t.updatedAt!);
                                const diffTime = Math.abs(now.getTime() - doneDate.getTime());
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                                // If within last 7 days (0 to 6)
                                if (diffDays >= 0 && diffDays < 7) {
                                  // Index 6 is today, 0 is 6 days ago
                                  const index = 6 - diffDays;
                                  dayCounts[index]++;
                                }
                              });

                              return dayCounts.map((count, idx) => ({
                                name: last7DaysLabels[idx],
                                value: count
                              }));
                            })()}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barSize={12}
                          >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#6B7280' }}
                              dy={10}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 10, fill: '#6B7280' }}
                            />
                            <Tooltip
                              cursor={{ fill: 'transparent' }}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar
                              dataKey="value"
                              radius={[4, 4, 0, 0]}
                            >
                              {
                                // Dynamic coloring
                                [0, 1, 2, 3, 4, 5, 6].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#c4b5fd', '#fde68a', '#86efac', '#fca5a5', '#93c5fd', '#c4b5fd', '#fde68a'][index]} />
                                ))
                              }
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Task Analytics Grid */}
                  <div>
                    <p className="text-xs font-bold text-[#121118] dark:text-white mb-2">Task analytics</p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="rounded-md p-2 border border-primary/30 bg-primary/10 dark:bg-primary/20">
                        <Folder className="w-3.5 h-3.5 text-primary mx-auto mb-0.5 block" />
                        <p className="text-xs font-bold text-[#121118] dark:text-white text-center">{pm.totalTasks}</p>
                        <p className="text-[9px] font-bold text-[#121118] dark:text-white text-center">Total tasks</p>
                      </div>
                      <div className="rounded-md p-2 border border-secondary/40 bg-secondary/20 dark:bg-secondary/10">
                        <Clock className="w-3.5 h-3.5 text-secondary-foreground mx-auto mb-0.5 block" />
                        <p className="text-xs font-bold text-[#121118] dark:text-white text-center">{pm.inProgress}</p>
                        <p className="text-[9px] font-bold text-[#121118] dark:text-white text-center">In progress</p>
                      </div>
                      <div className="rounded-md p-2 border border-accent/50 bg-accent/20 dark:bg-accent/10">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-foreground mx-auto mb-0.5 block" />
                        <p className="text-xs font-bold text-[#121118] dark:text-white text-center">{pm.completed}</p>
                        <p className="text-[9px] font-bold text-[#121118] dark:text-white text-center">Completed</p>
                      </div>
                      <div className="rounded-md p-2 border border-secondary/40 bg-secondary/20 dark:bg-secondary/10">
                        <AlertCircle className="w-3.5 h-3.5 text-secondary-foreground mx-auto mb-0.5 block" />
                        <p className="text-xs font-bold text-[#121118] dark:text-white text-center">{pm.overdue}</p>
                        <p className="text-[9px] font-bold text-[#121118] dark:text-white text-center">Overdue</p>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <hr className="border-[#dddbe6] dark:border-white/10" />

                  {/* Active phase (badge), Last activity (badge, centered), View full tracking */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-secondary/50 text-secondary-foreground border border-secondary/40 shrink-0">
                      Active phase: Phase {phaseNum} – {phaseName}
                    </span>
                    <div className="flex-1 flex justify-center min-w-0">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-accent/50 text-accent-foreground border border-accent/50 shrink-0">
                        <Activity className="w-3 h-3" />
                        Last activity: {pm.lastActivity ?? "—"}
                      </span>
                    </div>
                    <Link
                      to={`/projects/${proj?.id ?? 1}`}
                      className="text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                    >
                      View full tracking
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-500">Select a project to view metrics.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Invoices (Hidden) + Contracts & Support */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        {/* Invoices */}
        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
          <h3 className="text-[#121118] dark:text-white text-base font-bold mb-2">
            Invoices
          </h3>

          {isLoadingInvoices ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded-md animate-pulse" />
              ))}
            </div>
          ) : invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.slice(0, 3).map((invoice: any) => (
                <div key={invoice.id} className="flex items-center justify-between p-2 border border-[#dddbe6]/30 rounded-md hover:bg-[#faf7f1] dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#f1f0f5] dark:bg-white/10 p-1 rounded-md">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-[#121118] dark:text-white text-sm">
                        {invoice.invoice_number}
                      </p>
                      <p className="text-[10px] text-[#68608a]">
                        {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${invoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <p className="text-[10px] font-semibold text-[#121118] dark:text-white mt-0.5">
                      {invoice.currency} {invoice.amount}
                    </p>
                  </div>
                </div>
              ))}
              {invoices.length > 3 && (
                <p className="text-center text-xs text-primary cursor-pointer hover:underline">View all</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <FileText className="w-6 h-6 text-gray-300 mb-1" />
              <p className="text-xs text-gray-500">No invoices yet.</p>
            </div>
          )}
        </div>

        {/* Contracts & Support Row */}
        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
          <h3 className="text-[#121118] dark:text-white text-base font-bold mb-3">
            Contracts
          </h3>
          <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 flex flex-col items-center text-center shadow-sm">
            <div className="size-12 rounded-full bg-primary flex items-center justify-center mb-3 shadow-md">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <h4 className="text-[#121118] dark:text-white text-sm font-bold mb-1">
              Client Agreement
            </h4>
            <p className="text-[#68608a] dark:text-gray-400 text-xs mb-3 max-w-[240px]">
              {profile?.client_contract_signed
                ? "You have already signed the client agreement."
                : "Please sign the client agreement to proceed."}
            </p>
            <Link
              to="/client/contracts"
              className={`inline-flex items-center justify-center h-8 px-4 rounded-lg text-xs font-bold transition-colors shadow-md ${profile?.client_contract_signed
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-200"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                }`}
            >
              {profile?.client_contract_signed ? "View Contract" : "Sign Contract"}
            </Link>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
          <h3 className="text-[#121118] dark:text-white text-base font-bold mb-3">
            Support
          </h3>
          {/* Need Assistance? - primary color container */}
          <div className="rounded-xl bg-primary/10 dark:bg-primary/20 border border-primary/20 p-4 flex flex-col items-center text-center shadow-sm">
            <div className="size-12 rounded-full bg-primary flex items-center justify-center mb-3 shadow-md">
              <HeadphonesIcon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h4 className="text-[#121118] dark:text-white text-sm font-bold mb-1">
              Need Assistance?
            </h4>
            <p className="text-[#68608a] dark:text-gray-400 text-xs mb-3 max-w-[240px]">
              Our primary support team is available 24/7 for enterprise clients.
            </p>
            <a
              href="https://www.helpmenow-theunoia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 px-4 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-colors"
            >
              Raise Query
            </a>
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming Deadlines + Action Required */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
          <h3 className="text-[#121118] dark:text-white text-base font-bold mb-2">
            Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {activeProjects.slice(0, 3).map((project: any) => (
              <div key={project.id} className="flex items-start gap-2 p-1">
                <div className="bg-primary/10 dark:bg-primary/20 p-1 rounded-md border border-primary/20">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-[#121118] dark:text-white text-xs font-semibold">
                    {project.title}
                  </p>
                  <p className="text-[10px] text-primary font-medium">
                    Deadline: {project.bidding_deadline ? format(new Date(project.bidding_deadline), 'MMM d') : 'Pending'}
                  </p>
                </div>
              </div>
            ))}
            {activeProjects.length === 0 && (
              <p className="text-xs text-gray-400 italic">No upcoming deadlines.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 p-3 rounded-lg shadow-sm border border-black/5">
          <h3 className="text-[#121118] dark:text-white text-base font-bold mb-1">
            Action Required
          </h3>
          {actionItems.length > 0 ? (
            <div className="space-y-1">
              {actionItems.map((action, idx) => {
                const isPrimary = action.variant === "primary";
                const isSecondary = action.variant === "secondary";


                return (
                  <Link
                    to={action.link || "#"}
                    key={action.id || idx}
                    className={`flex items-center justify-between p-2 rounded-md transition-colors ${isPrimary
                      ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/15"
                      : isSecondary
                        ? "bg-secondary/20 dark:bg-secondary/10 hover:bg-secondary/30"
                        : "bg-accent/20 dark:bg-accent/10 hover:bg-accent/30"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-1 rounded-full ${isPrimary
                          ? "bg-primary animate-pulse"
                          : isSecondary
                            ? "bg-secondary-foreground"
                            : "bg-accent-foreground"
                          }`}
                      />
                      <span
                        className={`text-[10px] font-medium ${isPrimary
                          ? "text-primary font-semibold"
                          : isSecondary
                            ? "text-secondary-foreground"
                            : "text-accent-foreground"
                          }`}
                      >
                        {action.label}
                      </span>
                    </div>
                    <ArrowRight
                      className={`w-3.5 h-3.5 ${isPrimary
                        ? "text-primary"
                        : isSecondary
                          ? "text-secondary-foreground"
                          : "text-accent-foreground"
                        }`}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center p-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">All caught up!</span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardPage;
