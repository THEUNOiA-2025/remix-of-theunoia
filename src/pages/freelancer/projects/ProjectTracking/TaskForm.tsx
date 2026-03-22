import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskPriority, TaskStatus } from '@/pages/shared/projects/ProjectTracking/types';
import { X } from 'lucide-react';

interface TaskFormProps {
  phase: string;
  projectId: string;
  activePhase: string | null;
  onSave: (taskData: {
    title: string;
    description: string;
    assignee: string;
    deadline: string;
    priority: TaskPriority;
    status: TaskStatus;
  }) => void;
  onCancel: () => void;
}

export const TaskForm = ({ phase, projectId, activePhase, onSave, onCancel }: TaskFormProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !assignee.trim() || !deadline) return;
    
    // Always set status to 'to-do' when creating a task
    onSave({
      title: title.trim(),
      description: description.trim(),
      assignee: assignee.trim(),
      deadline,
      priority,
      status: 'to-do', // Default status is always 'to-do'
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setAssignee('');
    setDeadline('');
    setPriority('medium');
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 mb-2.5">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div>
          <Label htmlFor="title" className="text-[11px] font-bold text-slate-900 mb-0.5">
            Task Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            className="text-[11px] h-7"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="description" className="text-[11px] font-bold text-slate-900 mb-0.5">
            Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={2}
            className="text-[11px] resize-none"
          />
        </div>
        
        <div>
          <Label htmlFor="assignee" className="text-[11px] font-bold text-slate-900 mb-0.5">
            Assignee <span className="text-red-500">*</span>
          </Label>
          <Input
            id="assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Enter assignee name"
            className="text-[11px] h-7"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="deadline" className="text-[11px] font-bold text-slate-900 mb-0.5">
            Deadline <span className="text-red-500">*</span>
          </Label>
          <Input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="text-[11px] h-7"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="priority" className="text-[11px] font-bold text-slate-900 mb-0.5">
            Priority
          </Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
            <SelectTrigger className="w-full h-7 text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-1.5 pt-1.5">
          <Button
            type="submit"
            className="flex-1 bg-primary-purple text-white text-[11px] font-bold py-1.5"
          >
            Create Task
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-2.5 py-1.5"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
};

