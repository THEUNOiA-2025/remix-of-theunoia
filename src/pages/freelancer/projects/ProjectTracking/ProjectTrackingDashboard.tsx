import { useMemo } from 'react';
import { Folder, CheckCircle2, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Task, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { getPhasesForCategory } from '@/pages/shared/projects/ProjectTracking/phaseMapping';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface Activity {
  id: string;
  userName: string;
  taskName: string;
  oldStatus: TaskStatus | null;
  newStatus: TaskStatus;
  phase: string;
  timestamp: string;
}

interface ProjectTrackingDashboardProps {
  tasks: Task[];
  projectCategory: string | null;
  activities: Activity[];
}

const COLORS = {
  'to-do': '#8b5cf6', // purple
  'in-progress': '#3b82f6', // blue
  'done': '#10b981', // green
};

const getStatusLabel = (status: TaskStatus) => {
  switch (status) {
    case 'to-do':
      return 'Not Started';
    case 'in-progress':
      return 'On Progress';
    case 'done':
      return 'Completed';
    default:
      return status;
  }
};

export const ProjectTrackingDashboard = ({ tasks, projectCategory, activities }: ProjectTrackingDashboardProps) => {
  const phases = useMemo(() => getPhasesForCategory(projectCategory), [projectCategory]);

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

      // Get unique assignees for avatars
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
      { name: 'Not Started', value: toDo, color: COLORS['to-do'] },
      { name: 'On Progress', value: inProgress, color: COLORS['in-progress'] },
      { name: 'Completed', value: done, color: COLORS['done'] },
    ].filter(item => item.value > 0);
  }, [tasks]);

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Format date for activity
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

  // Group activities by date
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

  const chartConfig = {
    'not-started': { label: 'Not Started', color: COLORS['to-do'] },
    'on-progress': { label: 'On Progress', color: COLORS['in-progress'] },
    'completed': { label: 'Completed', color: COLORS['done'] },
  };

  return (
    <div className="w-full space-y-3.5">
      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Task */}
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Total task</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.total}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+7%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        {/* On Progress */}
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">On progress</span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.inProgress}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+3%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        {/* Completed */}
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.completed}</span>
            <div className="flex items-center gap-0.5 text-green-600">
              <TrendingUp className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">+9%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>

        {/* Overdue */}
        <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-slate-600 font-medium">Overdue</span>
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold text-slate-900">{metrics.overdue}</span>
            <div className="flex items-center gap-0.5 text-red-600">
              <TrendingDown className="w-2.5 h-2.5" />
              <span className="text-[9px] font-semibold">-2%</span>
            </div>
          </div>
          <p className="text-[8px] text-slate-500 mt-0.5">from last month</p>
        </div>
      </div>

      {/* Project Overview and Tasks Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Project Overview */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Project overview</h3>
          <div className="space-y-3">
            {phaseProgress.map((phase, index) => {
              const phaseColors = ['#10b981', '#8b5cf6', '#3b82f6', '#f59e0b', '#ef4444'];
              const color = phaseColors[index % phaseColors.length];

              return (
                <div key={phase.phase} className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-7 h-7 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Folder className="w-3.5 h-3.5" style={{ color }} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-slate-900">
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
                            <span className="text-[8px] text-slate-600">+{phase.assignees.length - 4}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] text-slate-600">
                      {phase.completedTasks} of {phase.totalTasks} tasks completed
                    </span>
                    <span className="text-[9px] font-bold text-slate-900">{phase.progress}%</span>
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

        {/* Tasks Progress and Latest Activity */}
        <div className="space-y-3">
          {/* Tasks Progress */}
          <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
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

          {/* Latest Activity */}
          <div className="bg-white border border-slate-200 rounded-sm p-3 shadow-sm">
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
      </div>
    </div>
  );
};

