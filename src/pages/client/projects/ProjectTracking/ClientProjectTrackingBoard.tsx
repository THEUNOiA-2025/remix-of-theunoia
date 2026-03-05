import { useState, useMemo, useEffect } from 'react';
import { ProjectTrackingService } from '@/services/ProjectTrackingService';
import { TaskCard } from '@/pages/freelancer/projects/ProjectTracking/TaskCard';
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import { Task, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { Activity } from '@/pages/freelancer/projects/ProjectTracking/ProjectTrackingDashboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown,
  Folder
} from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
import { toast } from 'sonner';
import {
  getActivePhase,
  canApproveLockPhase,
  shouldLockPhase,
  getPhaseStatusBadge,
  getNextPhase,
  getPhasePaymentStatus
} from '@/pages/shared/projects/ProjectTracking/phaseLockingLogic';
import { PhaseState, PhaseStatus } from '@/pages/shared/projects/ProjectTracking/phaseLockingTypes';

import { Textarea } from "@/components/ui/textarea";
import { useRazorpay } from '@/hooks/useRazorpay';

interface ClientProjectTrackingBoardProps {
  projectId: string;
  projectCategory: string | null;
}

export const ClientProjectTrackingBoard = ({ projectId, projectCategory }: ClientProjectTrackingBoardProps) => {
  const { user } = useAuth();
  const { initializePayment, isProcessing } = useRazorpay();
  const phases = useMemo(() => {
    const p = getPhasesForCategory(projectCategory);
    console.log('UI Expected Phases for category:', projectCategory, p);
    return p;
  }, [projectCategory]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // Phase states management
  const [phaseStates, setPhaseStates] = useState<PhaseState[]>([]);

  // Fetch data
  const fetchData = async () => {
    if (!projectId) return;
    try {
      console.log('Fetching project data for:', projectId, projectCategory);
      // Initialize phases if needed (though client view usually assumes project started, safe to check)
      await ProjectTrackingService.initializePhases(projectId, projectCategory);

      const [fetchedTasks, fetchedPhases, fetchedActivities] = await Promise.all([
        ProjectTrackingService.getTasks(projectId),
        ProjectTrackingService.getPhaseStates(projectId),
        ProjectTrackingService.getActivities(projectId)
      ]);

      console.log('Fetched Phases:', fetchedPhases);

      setTasks(fetchedTasks);
      setPhaseStates(fetchedPhases); // If empty, it means no phases found
      setActivities(fetchedActivities);
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error('Failed to load project data');
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchData();
    }
  }, [projectId, projectCategory]);

  // Lock approval dialog state
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [phaseToApprove, setPhaseToApprove] = useState<string | null>(null);

  // Get active phase and its index (for payment status)
  const activePhase = useMemo(() => getActivePhase(phases, phaseStates), [phases, phaseStates]);
  const activePhaseIndex = activePhase ? phases.indexOf(activePhase) : null;

  // Handle approve lock phase (client approval)
  const handleApproveLockPhase = async (phase: string) => {
    const validation = canApproveLockPhase(phase, phaseStates);
    if (!validation.allowed) {
      toast.error(validation.reason || 'Cannot approve lock for this phase');
      return;
    }

    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === phase);
      if (!phaseState) return;

      await ProjectTrackingService.updatePhaseState(phaseState.id, { client_approved: true });

      // Refresh phases (will trigger checkAndProcessPhaseLocks)
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);

      toast.success('Lock approved.');
      setApproveDialogOpen(false);
      setPhaseToApprove(null);
    } catch (error) {
      console.error('Error approving lock:', error);
      toast.error('Failed to approve lock');
    }
  };

  // Reject Dialog State
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [phaseToReject, setPhaseToReject] = useState<string | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  const openRejectDialog = (phase: string) => {
    setPhaseToReject(phase);
    setRejectionFeedback('');
    setRejectDialogOpen(true);
  };

  const handleRejectPhase = async () => {
    if (!phaseToReject || !rejectionFeedback.trim()) {
      toast.error("Please provide feedback for rejection");
      return;
    }

    try {
      const phaseState = phaseStates.find(ps => ps.phase_name === phaseToReject);
      if (!phaseState) return;

      await ProjectTrackingService.rejectPhaseWork(phaseState.id, rejectionFeedback);

      // Refresh phases
      const updatedPhases = await ProjectTrackingService.getPhaseStates(projectId);
      setPhaseStates(updatedPhases);

      // Refresh activities (optional)
      const updatedActivities = await ProjectTrackingService.getActivities(projectId);
      setActivities(updatedActivities);

      toast.success('Phase rejected. Feedback sent to freelancer.');
      setRejectDialogOpen(false);
      setPhaseToReject(null);
    } catch (error) {
      console.error('Error rejecting phase:', error);
      toast.error('Failed to reject phase');
    }
  };

  // Handle task status change (Parity with Student view)
  const handleTaskStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus } : t
      ));

      await ProjectTrackingService.updateTask(taskId, { status: newStatus });

      // Log activity
      await ProjectTrackingService.logActivity(projectId, {
        userName: user?.email || 'Client', // Use email or name
        taskName: task.title,
        oldStatus: task.status,
        newStatus: newStatus,
        phase: task.phase
      });

      // Refresh data
      const [updatedTasks, updatedActivities] = await Promise.all([
        ProjectTrackingService.getTasks(projectId),
        ProjectTrackingService.getActivities(projectId)
      ]);
      setTasks(updatedTasks);
      setActivities(updatedActivities);

      toast.success(`Task marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task status');
      // Revert optimistic update
      const fetchedTasks = await ProjectTrackingService.getTasks(projectId);
      setTasks(fetchedTasks);
    }
  };

  // Check and lock phase if both approved
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

  // Open approve dialog
  const openApproveDialog = (phase: string) => {
    setPhaseToApprove(phase);
    setApproveDialogOpen(true);
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
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${paymentClass} flex items-center justify-between`}>
                      <span>Payment: {paymentLabel}</span>
                      {paymentStatus === 'pending' && (
                        <button
                          onClick={() => initializePayment(projectId)}
                          disabled={isProcessing}
                          className="ml-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded leading-none transition-colors border border-transparent hover:border-blue-800 disabled:opacity-50"
                        >
                          {isProcessing ? 'Processing' : 'Pay Now'}
                        </button>
                      )}
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

      {/* Kanban Board - Full Width */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 mb-3">Kanban Board</h3>
        <div className="w-full overflow-x-auto pb-4">
          <div className="flex gap-3.5 min-w-max">
            {phases.map((phase, index) => {
              const tasksForPhase = getTasksForPhase(phase);
              const phaseState = phaseStates.find(ps => ps.phase_name === phase);

              if (index === 0) {
                console.log(`Matching phase "${phase}" against DB states:`, phaseStates.map(p => p.phase_name));
                console.log(`Match result for ${phase}:`, phaseState);
                if (phaseState) {
                  console.log(`Phase "${phase}" status:`, phaseState.status);
                }
              }

              const isActive = phaseState?.status === 'active';
              const isLocked = phaseState?.status === 'locked';
              const isUnlocked = phaseState?.status === 'unlocked' || !phaseState;
              const isPending = phaseState?.status === 'pending';
              const badgeInfo = phaseState ? getPhaseStatusBadge(phaseState.status) : null;

              // Check if phase is complete (all tasks done)
              const isPhaseComplete = tasksForPhase.length > 0 && tasksForPhase.every(t => t.status === 'done');

              // Check if can approve lock (freelancer approved, client not yet)
              const canApprove = phaseState?.freelancer_approved && !phaseState?.client_approved;

              return (
                <div
                  key={phase}
                  className={`flex-shrink-0 w-72 rounded-sm border p-3.5 ${isActive
                    ? 'bg-green-50 border-green-200'
                    : isLocked
                      ? 'bg-slate-100 border-slate-300 opacity-75'
                      : isUnlocked
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-slate-50 border-slate-200 opacity-50'
                    }`}
                >
                  {/* Phase Header - Read Only */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className={`w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center ${isActive ? 'bg-green-600' : isLocked ? 'bg-slate-500' : 'bg-slate-400'
                        }`}>
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-xs text-slate-900">{phase}</h3>
                          {badgeInfo && (
                            <Badge className={`${badgeInfo.className} text-[9px] px-1.5 py-0.5`}>
                              {badgeInfo.label}
                            </Badge>
                          )}
                        </div>
                        {isLocked && phaseState.locked_at && (
                          <p className="text-[9px] text-slate-500">
                            Locked {new Date(phaseState.locked_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* No add button for client - Read only */}
                  </div>

                  {/* Approve Lock Phase - Only when freelancer has approved */}
                  {isActive && isPhaseComplete && canApprove && (
                    <div className="mb-3 p-2 bg-white rounded-sm border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-blue-900 mb-0.5">Approve Lock Phase</p>
                          <p className="text-[9px] text-blue-600">
                            Freelancer has requested to lock this phase. Approve to proceed.
                          </p>
                        </div>
                        <Switch
                          checked={false}
                          onCheckedChange={() => openApproveDialog(phase)}
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => openRejectDialog(phase)}
                          className="text-[10px] text-red-600 font-semibold hover:underline bg-red-50 px-2 py-1 rounded border border-red-100"
                        >
                          Reject Work
                        </button>
                      </div>

                      {phaseState.submission_message && (
                        <div className="mt-2 text-[9px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                          "{phaseState.submission_message}"
                        </div>
                      )}

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
                    </div>
                  )}

                  {/* Waiting for freelancer message - When freelancer hasn't requested lock yet */}
                  {isActive && isPhaseComplete && !canApprove && !phaseState?.client_approved && (
                    <div className="mb-3 p-2 bg-white rounded-sm border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-slate-900 mb-0.5">Waiting for Freelancer</p>
                          <p className="text-[9px] text-slate-600">
                            All tasks completed. Waiting for freelancer to request lock.
                          </p>
                        </div>
                        <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center">
                          <Clock className="w-3 h-3 text-slate-500" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Both approved - phase will be locked */}
                  {phaseState?.freelancer_approved && phaseState?.client_approved && phaseState?.status !== 'locked' && (
                    <div className="mb-3 p-2 bg-white rounded-sm border border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-green-900 mb-0.5">Lock Approved</p>
                          <p className="text-[9px] text-green-600">
                            Both approvals received. Phase will be locked.
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>

                      {phaseState.submission_attachments && phaseState.submission_attachments.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-green-100">
                          <p className="text-[9px] font-semibold text-green-800 mb-1">Approved Files:</p>
                          <div className="space-y-1">
                            {phaseState.submission_attachments.map((file: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 bg-white/50 p-1.5 rounded border border-green-100">
                                <Folder className="w-3 h-3 text-green-600" />
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-green-700 hover:underline truncate flex-1"
                                >
                                  {file.name}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Task Cards - Read Only */}
                  <div className="space-y-0">
                    {tasksForPhase.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={handleTaskStatusChange}
                        // Allow client to change status if needed (parity with student)
                        // But strictly follow phase active/locked rules
                        disabled={!isActive || isLocked || isPending || !phaseState}
                      />
                    ))}
                  </div>

                  {/* Empty State */}
                  {tasksForPhase.length === 0 && (
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

        {/* Latest Activity */}
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

      {/* Approve Lock Phase Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Lock Phase</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to approve locking this phase?
              </p>
              <p className="font-semibold text-amber-600">
                ⚠️ Important: Once this phase is locked, neither you nor the freelancer can modify anything in this phase. It will be permanently locked.
              </p>
              <p>
                Make sure you have reviewed all deliverables and are satisfied with the work before approving.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => phaseToApprove && handleApproveLockPhase(phaseToApprove)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Approve Lock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Phase Confirmation Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Phase Work</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide feedback for the freelancer on why you are rejecting this work. They will be notified to make changes and resubmit.
              <div className="mt-4">
                <Textarea
                  value={rejectionFeedback}
                  onChange={(e) => setRejectionFeedback(e.target.value)}
                  placeholder="Enter rejection feedback..."
                  className="min-h-[100px]"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPhase}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Work
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
