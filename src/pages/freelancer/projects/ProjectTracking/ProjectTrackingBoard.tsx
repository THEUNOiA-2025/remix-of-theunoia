import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { ProjectTrackingService } from '@/services/ProjectTrackingService';
import { useEffect } from 'react';
import { FileUploader } from "@/components/FileUploader";
import { FileList } from "@/components/FileList";
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import { Task, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { Activity } from './ProjectTrackingDashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  Folder, MessageCircle, Eye
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import {
  getActivePhase,
  canChangeTaskStatus,
  canAddTaskToPhase,
  canRequestLockPhase,
  shouldLockPhase,
  getPhaseStatusBadge,
  getNextPhase,
  getPhasePaymentStatus
} from '@/pages/shared/projects/ProjectTracking/phaseLockingLogic';
import { PhaseState, PhaseStatus } from '@/pages/shared/projects/ProjectTracking/phaseLockingTypes';

interface ProjectTrackingBoardProps {
  projectId: string;
  projectCategory: string | null;
}

export const ProjectTrackingBoard = ({ projectId, projectCategory }: ProjectTrackingBoardProps) => {
  const { user } = useAuth();
  const phases = useMemo(() => getPhasesForCategory(projectCategory), [projectCategory]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showFormForPhase, setShowFormForPhase] = useState<string | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Phase states management
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      // Initialize phases if needed
      await ProjectTrackingService.initializePhases(projectId, projectCategory);

      const [fetchedTasks, fetchedPhases, fetchedActivities] = await Promise.all([
        ProjectTrackingService.getTasks(projectId),
        ProjectTrackingService.getPhaseStates(projectId),
        ProjectTrackingService.getActivities(projectId)
      ]);

      setTasks(fetchedTasks);
      setPhaseStates(fetchedPhases);
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId, projectCategory]);

  // Lock phase dialog state
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [phaseToLock, setPhaseToLock] = useState<string | null>(null);

  // Get active phase and its index (for payment status)
  const activePhase = useMemo(() => getActivePhase(phases, phaseStates), [phases, phaseStates]);
  const activePhaseIndex = activePhase ? phases.indexOf(activePhase) : null;

  // Check if all phases are locked (initial setup complete)
  const allPhasesLocked = useMemo(() => {
    return phaseStates.every(ps => ps.status === 'locked');
  }, [phaseStates]);

  // Track if "Lock All" has been clicked (initial setup phase)
  // If there are no phases with 'unlocked' status, initial setup is complete
  const initialSetupComplete = useMemo(() => {
    if (phaseStates.length === 0) return true; // Loading or no phases
    return phaseStates.every(ps => ps.status !== 'unlocked');
  }, [phaseStates]);

  const allPhasesHaveTasks = useMemo(() => {
    return phases.every(phase => {
      return tasks.some(task => task.phase === phase);
    });
  }, [phases, tasks]);

  const [isLocking, setIsLocking] = useState(false);

  const handleLockAllPhases = async (checked: boolean) => {
    if (!checked || !allPhasesHaveTasks) return;

    try {
      setIsLocking(true);
      await ProjectTrackingService.startProjectWorkflow(projectId, phaseStates);

      // Refresh phases
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);
      toast.success('Project workflow started successfully');
    } catch (error) {
      console.error('Error starting project workflow:', error);
      toast.error('Failed to start project workflow');
    } finally {
      setIsLocking(false);
    }
  };

  // Get user name for activities
  const getUserName = () => {
    if (user?.user_metadata?.first_name || user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name || ''} ${user.user_metadata.last_name || ''}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const handleCreateTask = async (phase: string, taskData: {
    title: string;
    description: string;
    assignee: string;
    deadline: string;
    priority: 'high' | 'medium' | 'low';
    status: TaskStatus;
  }) => {
    // Validate if task can be added to this phase
    const validation = canAddTaskToPhase(phase, activePhase, phaseStates, initialSetupComplete);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot add task to this phase');
      setShowFormForPhase(null);
      return;
    }

    try {
      const newTask = {
        ...taskData,
        status: 'to-do' as TaskStatus,
        phase,
        projectId,
      };

      await ProjectTrackingService.createTask(newTask);

      // Refresh tasks
      const updatedTasks = await ProjectTrackingService.getTasks(projectId);
      setTasks(updatedTasks);

      setShowFormForPhase(null);
      toast.success('Task created successfully');
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      console.error(`Task not found with ID: ${taskId}`);
      return;
    }

    console.log(`Advancing task status for task "${task.title}" (ID: ${taskId}) to: ${newStatus}`);
    console.log(`Current active phase: ${activePhase}, Task phase: ${task.phase}`);

    // Validate if task status can be changed
    const validation = canChangeTaskStatus(task, activePhase, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot change task status');
      return;
    }

    const oldStatus = task.status;

    try {
      // Update task
      await ProjectTrackingService.updateTask(taskId, { status: newStatus });

      // Log activity
      if (oldStatus !== newStatus) {
        await ProjectTrackingService.logActivity(projectId, {
          userName: getUserName(),
          taskName: task.title,
          oldStatus: oldStatus,
          newStatus: newStatus,
          phase: task.phase
        });
      }

      // Refresh data
      const [updatedTasks, updatedActivities] = await Promise.all([
        ProjectTrackingService.getTasks(projectId),
        ProjectTrackingService.getActivities(projectId)
      ]);

      setTasks(updatedTasks);
      setActivities(updatedActivities);
      toast.success(`Task status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
    }
  };



  // Handle request lock phase (freelancer approval)
  const handleRequestLockPhase = async (phase: string) => {
    const validation = canRequestLockPhase(phase, tasks, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot request lock for this phase');
      return;
    }

    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === phase);
      if (!phaseState) return;

      await ProjectTrackingService.updatePhaseState(phaseState.id, { freelancer_approved: true });

      // Refresh phases
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);

      toast.success('Lock request sent. Waiting for client approval.');
      setLockDialogOpen(false);
      setPhaseToLock(null);
    } catch (error) {
      console.error('Error requesting phase lock:', error);
      toast.error('Failed to request phase lock');
    }
  };

  // Check and lock phase if both approved (this runs when client approves)
  // Check and lock phase if both approved (this runs when client approves)
  // Converting this to a regular function or effect that checks after updates might be safer
  // But maintaining current structure:
  const checkAndProcessPhaseLocks = async () => {
    let updatesMade = false;
    for (const phaseState of phaseStates) {
      if (shouldLockPhase(phaseState)) {
        try {
          // Lock the phase
          await ProjectTrackingService.updatePhaseState(phaseState.id, {
            status: 'locked',
            locked_at: new Date().toISOString(),
            locked_by: user?.id || undefined
          });

          // Unlock next phase
          const nextPhaseName = getNextPhase(phaseState.phase_name, phases);
          if (nextPhaseName) {
            const nextPhaseState = phaseStates.find(ps => ps.phase_name === nextPhaseName);
            if (nextPhaseState) {
              await ProjectTrackingService.updatePhaseState(nextPhaseState.id, {
                status: 'active',
                freelancer_approved: false,
                client_approved: false
              });
              toast.success(`Phase "${phaseState.phase_name}" locked. Phase "${nextPhaseName}" is now active.`);
            }
          } else {
            toast.success(`Phase "${phaseState.phase_name}" locked. All phases complete!`);
          }
          updatesMade = true;
        } catch (error) {
          console.error('Error processing phase lock:', error);
        }
      }
    }

    if (updatesMade) {
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);
    }
  };

  useEffect(() => {
    if (phaseStates.length > 0) {
      checkAndProcessPhaseLocks();
    }
  }, [phaseStates, phases, user?.id]);

  // Submission Dialog State
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<string | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<any[]>([]);

  const openSubmissionDialog = (phase: string) => {
    setSubmissionPhase(phase);
    setSubmissionMessage('');
    setSubmissionFiles([]);
    setSubmissionDialogOpen(true);
  };

  const handleSubmitWork = async () => {
    if (!submissionPhase) return;

    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === submissionPhase);
      if (!phaseState) return;

      await ProjectTrackingService.submitPhaseWork(phaseState.id, submissionMessage, submissionFiles);

      // Refresh phases
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);

      toast.success("Work submitted successfully!");
      setSubmissionDialogOpen(false);
    } catch (error) {
      console.error("Error submitting work:", error);
      toast.error("Failed to submit work");
    }
  };

  const handleClientApprovePhase = async (phase: string) => {
    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === phase);
      if (!phaseState) return;

      // Update client_approved = true. The checkAndProcessPhaseLocks effect will handle the actual locking logic.
      await ProjectTrackingService.updatePhaseState(phaseState.id, { client_approved: true });

      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);
      toast.success("Phase approved!");
    } catch (error) {
      console.error("Error approving phase:", error);
      toast.error("Failed to approve phase");
    }
  };

  const handleRejectPhase = async (phase: string) => {
    // In a real app, this would open a dialog to enter feedback. For now, using prompt.
    const feedback = window.prompt("Enter rejection feedback:");
    if (!feedback) return;

    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === phase);
      if (!phaseState) return;

      await ProjectTrackingService.rejectPhaseWork(phaseState.id, feedback);

      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);
      toast.success("Phase rejected");
    } catch (error) {
      console.error("Error rejecting phase:", error);
      toast.error("Failed to reject phase");
    }
  };

  // Check if waiting for client approval
  const isWaitingForClient = (phaseState: PhaseState) => {
    return phaseState.freelancer_approved && !phaseState.client_approved;
  };

  const getTasksForPhase = (phase: string): Task[] => {
    return tasks.filter(task => task.phase === phase);
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const overdue = tasks.filter(t => {
      if (t.status === 'done') return false;
      return new Date(t.deadline) < new Date();
    }).length;
    return { total, inProgress, completed, overdue };
  }, [tasks]);

  // Calculate phase progress
  const phaseProgress = useMemo(() => {
    return phases.map((phase, index) => {
      const phaseTasks = tasks.filter(t => t.phase === phase);
      const totalTasks = phaseTasks.length;
      const completedTasks = phaseTasks.filter(t => t.status === 'done').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const assignees = Array.from(new Set(phaseTasks.map(t => t.assignee)));
      return {
        phase,
        phaseNumber: index + 1,
        totalTasks,
        completedTasks,
        progress,
        assignees,
      };
    });
  }, [phases, tasks]);

  // Calculate task status distribution for chart
  const taskStatusData = useMemo(() => {
    const toDo = tasks.filter(t => t.status === 'to-do').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const done = tasks.filter(t => t.status === 'done').length;
    return [
      { name: 'Not Started', value: toDo, color: '#8b5cf6' },
      { name: 'On Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Completed', value: done, color: '#10b981' },
    ].filter(item => item.value > 0);
  }, [tasks]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatActivityDate = (date: string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    } else {
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  };

  const groupedActivities = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    activities.forEach(activity => {
      const date = formatActivityDate(activity.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  }, [activities]);

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case 'to-do': return 'Not Started';
      case 'in-progress': return 'On Progress';
      case 'done': return 'Completed';
      default: return status;
    }
  };

  const chartConfig = {
    'not-started': { label: 'Not Started', color: '#8b5cf6' },
    'on-progress': { label: 'On Progress', color: '#3b82f6' },
    'completed': { label: 'Completed', color: '#10b981' },
  };

  const phaseColors = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="w-full pb-4 px-3.5 space-y-3.5">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-primary border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-black font-bold">Total task</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-black">{metrics.total}</span>
            <div className="flex items-center gap-0.5 text-black">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">+7%</span>
            </div>
          </div>
          <p className="text-[8px] text-black font-bold mt-0.5">from last month</p>
        </div>

        <div className="bg-secondary border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-black font-bold">On progress</span>
            <Clock className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-black">{metrics.inProgress}</span>
            <div className="flex items-center gap-0.5 text-black">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">+3%</span>
            </div>
          </div>
          <p className="text-[8px] text-black font-bold mt-0.5">from last month</p>
        </div>

        <div className="bg-accent border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-black font-bold">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-black">{metrics.completed}</span>
            <div className="flex items-center gap-0.5 text-black">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">+9%</span>
            </div>
          </div>
          <p className="text-[8px] text-black font-bold mt-0.5">from last month</p>
        </div>

        <div className="bg-secondary border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-black font-bold">Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-black" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-black">{metrics.overdue}</span>
            <div className="flex items-center gap-0.5 text-black">
              <TrendingDown className="w-2.5 h-2.5" />
              <span className="text-[9px] font-bold">-2%</span>
            </div>
          </div>
          <p className="text-[8px] text-black font-bold mt-0.5">from last month</p>
        </div>
      </div>

      {/* Project Overview */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-900">Project overview</h3>
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {phaseProgress.map((phase, index) => {
              const color = phaseColors[index % phaseColors.length];
              const paymentStatus = getPhasePaymentStatus(index, phases.length, activePhaseIndex);
              const paymentLabel = paymentStatus === 'done' ? 'Done' : paymentStatus === 'pending' ? 'Pending' : 'Not yet started';
              const paymentClass = paymentStatus === 'done' ? 'text-green-700 bg-green-100' : paymentStatus === 'pending' ? 'text-amber-700 bg-amber-100' : 'text-slate-500 bg-slate-100';
              return (
                <div key={phase.phase} className="flex-shrink-0 w-56 bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Folder className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-black">
                          Phase {phase.phaseNumber}: {phase.phase}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          {phase.assignees.slice(0, 4).map((assignee, idx) => (
                            <div
                              key={idx}
                              className="w-4 h-4 rounded-full bg-primary-purple text-white flex items-center justify-center text-[8px] font-bold"
                            >
                              {getInitials(assignee)}
                            </div>
                          ))}
                          {phase.assignees.length > 4 && (
                            <span className="text-[8px] text-black font-bold">+{phase.assignees.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-1.5">
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${paymentClass}`}>
                      Payment: {paymentLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-black font-bold">
                      {phase.completedTasks} of {phase.totalTasks} tasks completed
                    </span>
                    <span className="text-[9px] font-bold text-black">{phase.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${phase.progress}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Initial Setup */}
      {!initialSetupComplete && (
        <div className="bg-white border border-slate-200 rounded-sm p-4 mb-4 shadow-sm flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Initial Setup</h3>
            <p className="text-[11px] text-slate-600">
              All phases have tasks. Lock all phases to start the project.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-slate-700">Lock All Phases</span>
            <Switch
              checked={false} // It's essentially uncheckable once checked
              onCheckedChange={handleLockAllPhases}
              disabled={!allPhasesHaveTasks || isLocking}
            />
          </div>
        </div>
      )}

      {/* Kanban Board - Full Width */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 mb-3">Kanban Board</h3>
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-3.5 min-w-max">
            {phases.map((phase, index) => {
              const phaseTasks = getTasksForPhase(phase);
              const isFormOpen = showFormForPhase === phase;
              const phaseState = phaseStates.find(ps => ps.phase_name === phase);

              // Keep unlocked status as is for initial setup
              const effectiveStatus = phaseState?.status;

              const isActive = effectiveStatus === 'active';
              const isLocked = effectiveStatus === 'locked'; // This means COMPLETED
              const isPending = effectiveStatus === 'pending';
              const isUnlocked = effectiveStatus === 'unlocked';

              const canAddOrEdit = isActive || isUnlocked;

              // Any other status (pending, unlocked, or missing) is effectively "Future/Locked" for visual purposes
              // Wait, unlocked is not future, it's active-like.
              const isFuture = !canAddOrEdit && !isLocked;
              const badgeInfo = phaseState ? getPhaseStatusBadge(effectiveStatus as any) : null;

              // Check if phase is complete (all tasks done)
              const isPhaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'done');

              // Can add task:
              // - Before initial setup: if phase is active (Phase 1) or pending (others can have tasks initially)
              // - After initial setup: if phase is active
              let canAddTask = true; // Default to true to allow form to show

              if (phaseState) {
                // If we have state, check if it's effectively active or unlocked
                canAddTask = canAddOrEdit;
              }

              // Check if form should be shown for this phase
              const shouldShowForm = isFormOpen && canAddTask;

              return (
                <div
                  key={phase}
                  className={`flex-shrink-0 w-72 rounded-sm border p-3.5 ${canAddOrEdit
                    ? 'bg-blue-50/50 border-blue-200'
                    : isLocked
                      ? 'bg-slate-100 border-slate-300 opacity-75' // Completed
                      : 'bg-slate-50 border-slate-200 opacity-40 grayscale' // Pending/Future
                    }`}
                >
                  {/* Phase Header */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${canAddOrEdit ? 'bg-blue-500' : isLocked ? 'bg-slate-500' : 'bg-slate-400'
                        }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xs text-slate-900">{phase}</h3>
                          {badgeInfo && !isFuture && (
                            <Badge className={`${badgeInfo.className} text-[9px] px-1.5 py-0.5`}>
                              {badgeInfo.label}
                            </Badge>
                          )}
                          {isFuture && (
                            <Badge className="bg-slate-200 text-slate-600 hover:bg-slate-200 text-[9px] px-1.5 py-0.5">
                              Locked
                            </Badge>
                          )}
                        </div>
                        {isLocked && phaseState.locked_at && (
                          <p className="text-[9px] text-slate-500">
                            Completed {new Date(phaseState.locked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {canAddTask && !isFormOpen && (
                      <button
                        onClick={() => {
                          console.log('Add button clicked for phase:', phase);
                          setShowFormForPhase(phase);
                        }}
                        className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center hover:bg-primary-purple/90 transition-colors flex-shrink-0"
                        title="Add task"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>



                  {/* Task Form - Show when form is open for this phase */}
                  {isFormOpen && (
                    <div className="mb-3">
                      <TaskForm
                        phase={phase}
                        projectId={projectId}
                        activePhase={activePhase}
                        onSave={(taskData) => {
                          console.log('Task form submitted for phase:', phase);
                          handleCreateTask(phase, taskData);
                        }}
                        onCancel={() => {
                          console.log('Task form cancelled');
                          setShowFormForPhase(null);
                        }}
                      />
                    </div>
                  )}

                  {/* Task Cards */}
                  <div className="space-y-0">
                    {phaseTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                        disabled={!canAddOrEdit}
                      />
                    ))}
                  </div>

                  {/* Phase Actions - Moved to bottom for better flow */}
                  {isActive && phaseState && (
                    <div className="mt-3 p-2 bg-white rounded-sm border border-slate-200">
                      {!phaseState.freelancer_approved ? (
                        // Case 1: Not submitted yet
                        phaseState.rejection_feedback ? (
                          // Case 1.1: Rejected - Show feedback and resubmit
                          <div className="space-y-2">
                            <div className="bg-red-50 p-2 rounded text-[10px] text-red-700 border border-red-100">
                              <span className="font-bold block mb-1">Feedback from Client:</span>
                              {phaseState.rejection_feedback}
                            </div>
                            <button
                              onClick={() => openSubmissionDialog(phase)}
                              className="w-full py-1.5 bg-primary-purple text-white text-[10px] font-bold rounded-sm hover:bg-primary-purple/90 transition-colors"
                            >
                              Resubmit Work
                            </button>
                          </div>
                        ) : (
                          // Case 1.2: Normal submission
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-[10px] font-semibold text-slate-900 mb-0.5">Submit Phase</p>
                                <p className="text-[9px] text-slate-600">
                                  {isPhaseComplete
                                    ? "All tasks completed. Submit work for review."
                                    : "Complete all tasks to submit for review."}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => openSubmissionDialog(phase)}
                              disabled={!isPhaseComplete}
                              className={`w-full py-1.5 text-[10px] font-bold rounded-sm transition-colors ${isPhaseComplete
                                ? 'bg-primary-purple text-white hover:bg-primary-purple/90 cursor-pointer'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                }`}
                            >
                              Submit for Review
                            </button>
                          </div>
                        )
                      ) : !phaseState.client_approved ? (
                        // Case 2: Submitted, waiting for client
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-[10px] font-semibold text-blue-900 mb-0.5">Under Review</p>
                              <p className="text-[9px] text-blue-600">
                                {phaseState.submission_message ? `Submitted: "${phaseState.submission_message.substring(0, 30)}${phaseState.submission_message.length > 30 ? '...' : ''}"` : 'Work submitted for review.'}
                              </p>
                            </div>
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock className="w-3 h-3 text-blue-600" />
                            </div>
                          </div>

                          {phaseState.submission_attachments && phaseState.submission_attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[9px] font-semibold text-slate-700 mb-1">Attached Files:</p>
                              <div className="space-y-1">
                                {phaseState.submission_attachments.map((file: any, index: number) => (
                                  <div key={index} className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                                    <Folder className="w-3 h-3 text-slate-400" />
                                    <a
                                      href={file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[9px] text-blue-600 hover:underline truncate flex-1"
                                    >
                                      {file.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Client Actions Simulation - REMOVED for Freelancer View parity */}
                        </div>
                      ) : (
                        // Case 3: Approved
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] font-semibold text-green-900 mb-0.5">Phase Approved</p>
                            <p className="text-[9px] text-green-600">
                              Work accepted. Phase locked.
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Empty State */}
                  {!isFormOpen && phaseTasks.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-[11px]">
                      No tasks yet
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tasks Progress and Latest Activity - Below Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Tasks Progress */}
        <div className="bg-secondary border border-slate-200 rounded-sm p-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-2.5">Tasks progress</h3>
          {taskStatusData.length > 0 ? (
            <div className="relative h-[180px]">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taskStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[9px] text-slate-600 font-medium">Total task</p>
                  <p className="text-lg font-bold text-slate-900">{metrics.total}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-slate-400 text-[10px]">
              No tasks yet
            </div>
          )}
          <div className="mt-2.5 space-y-1">
            {taskStatusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-[9px]">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">
                  {metrics.total > 0 ? Math.round((item.value / metrics.total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Work - {submissionPhase}</DialogTitle>
              <DialogDescription>
                Submit your work for client review. Once approved, the next phase will unlock.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="message">Submission Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe the work you've completed..."
                  value={submissionMessage}
                  onChange={(e) => setSubmissionMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Attachments</Label>
                <FileUploader
                  type="file"
                  maxFiles={5}
                  maxSizeInMB={10}
                  onFilesChange={setSubmissionFiles}
                  currentFiles={submissionFiles}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmissionDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmitWork}>Submit for Review</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>   {/* Latest Activity */}
        <div className="bg-accent border border-slate-200 rounded-sm p-3 shadow-sm">
          <h3 className="text-xs font-bold text-slate-900 mb-2.5">Latest Activity</h3>
          <div className="space-y-2.5 max-h-[350px] overflow-y-auto">
            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
              <div key={date}>
                <h4 className="text-[9px] font-bold text-slate-600 mb-1.5">{date}</h4>
                <div className="space-y-2">
                  {dateActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">
                        {getInitials(activity.userName)}
                      </div>
                      <div className="flex-1">
                        <p className="text-[9px] text-slate-900 leading-relaxed">
                          <span className="font-semibold">{activity.userName}</span>
                          {' '}changed task{' '}
                          <span className="font-semibold">"{activity.taskName}"</span>
                          {activity.oldStatus && (
                            <> from <span className="font-semibold">{getStatusLabel(activity.oldStatus)}</span></>
                          )}
                          {' '}to <span className="font-semibold">{getStatusLabel(activity.newStatus)}</span>
                          {' '}in <span className="font-semibold">Phase {phases.findIndex(p => p === activity.phase) + 1}: {activity.phase}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-3 text-slate-400 text-[9px]">
                No activity yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lock Phase Confirmation Dialog */}
      <AlertDialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Lock Phase</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to request to lock this phase?
              </p>
              <p className="font-semibold text-red-600">
                ⚠️ Important: Once this phase is locked, you cannot come back and modify anything in this phase. It will be permanently locked.
              </p>
              <p>
                The client needs to accept your lock request for the phase to be locked.
              </p>
              <p className="font-medium text-blue-600">
                💡 Recommendation: Schedule a review call with your client for this phase. During the meeting, have your client approve and lock the phase together.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => phaseToLock && handleRequestLockPhase(phaseToLock)}
              className="bg-red-600 hover:bg-red-700"
            >
              Request Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>


    </div>
  );
};

