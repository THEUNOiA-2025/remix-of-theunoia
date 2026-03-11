import { Task, TaskPriority, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { format } from 'date-fns';
import { MessageCircle, Eye } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  disabled?: boolean;
}

const getPriorityColor = (priority: TaskPriority) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};



export const TaskCard = ({ task, onStatusChange, disabled = false }: TaskCardProps) => {
  const priorityColor = getPriorityColor(task.priority);


  // Get first letter of assignee name for avatar
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStatusSelect = (newStatus: TaskStatus) => {
    if (disabled) return;
    onStatusChange(task.id, newStatus);
  };

  return (
    <div className={`bg-white border rounded-none p-2.5 shadow-sm transition-all mb-2.5 overflow-hidden ${disabled
      ? 'border-slate-300 opacity-60 cursor-not-allowed'
      : 'border-slate-200 hover:shadow-md'
      }`}>
      {/* Title */}
      <h4 className={`font-semibold text-xs text-slate-900 mb-1 line-clamp-1 break-words ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
        {task.title}
      </h4>

      {/* Description */}
      <p className={`text-[11px] text-slate-600 mb-2.5 line-clamp-2 leading-relaxed break-words overflow-hidden ${task.status === 'done' ? 'line-through opacity-50' : ''}`}>
        {task.description}
      </p>

      {/* Priority: Badge */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] text-slate-600 font-medium">Priority:</span>
        <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-semibold border ${priorityColor}`}>
          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
        </span>
      </div>

      {/* Status: Toggle Button */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[11px] text-slate-600 font-medium">Status:</span>
        <button
          onClick={() => {
            if (task.status !== 'done') {
              handleStatusSelect('done');
            }
          }}
          disabled={disabled || task.status === 'done'}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-sm border transition-all ${task.status === 'done'
            ? 'bg-green-50 text-green-700 border-green-200 opacity-90'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            } ${(disabled || task.status === 'done') ? 'cursor-not-allowed' : 'cursor-pointer'}`}
          title={task.status === 'done' ? "Task is completed" : "Mark as Done"}
        >
          {task.status === 'done' ? (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-600 flex items-center justify-center">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-[9px] font-semibold">Done</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border border-slate-400"></div>
              <span className="text-[9px] font-semibold">Mark Done</span>
            </div>
          )}
        </button>
      </div>

      {/* Deadline: Date */}
      <div className="flex items-center gap-1.5 mb-2.5">
        <span className="text-[11px] text-slate-600 font-medium">Deadline:</span>
        <span className="text-[11px] text-slate-700 font-medium">
          {format(new Date(task.deadline), "d MMM")}
        </span>
      </div>

      {/* Separator Line */}
      <div className="border-t border-slate-200 mb-2.5"></div>

      {/* Avatars and Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Avatar */}
          <div className="w-5 h-5 rounded-full bg-primary-purple text-white flex items-center justify-center text-[9px] font-bold">
            {getInitials(task.assignee)}
          </div>
          <span className="text-[11px] text-slate-700 font-medium">{task.assignee}</span>
        </div>

        {/* Comments and Views */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-0.5">
            <MessageCircle className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-600">0</span>
          </div>
          <div className="flex items-center gap-0.5">
            <Eye className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] text-slate-600">0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

