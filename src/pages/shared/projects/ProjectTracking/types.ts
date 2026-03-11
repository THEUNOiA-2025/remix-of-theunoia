// Types for Project Tracking Board

export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'to-do' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  deadline: string; // ISO date string
  priority: TaskPriority;
  status: TaskStatus;
  phase: string; // Phase name (e.g., "Discovery", "Drafting")
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PhaseColumn {
  name: string;
  tasks: Task[];
}
