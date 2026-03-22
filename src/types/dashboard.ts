
export type TodoPriority = 'low' | 'medium' | 'high';

export interface UserTodo {
    id: string;
    user_id: string;
    text: string;
    completed: boolean;
    priority: TodoPriority;
    created_at: string;
    updated_at: string;
}

export type WeeklyFocus = 'work' | 'learning' | 'personal';

export interface WeeklyTask {
    id: string;
    text: string;
    completed: boolean;
    priority: TodoPriority;
}

export interface UserWeeklyPlan {
    id: string;
    user_id: string;
    date: string; // YYYY-MM-DD
    tasks: WeeklyTask[];
    focus: WeeklyFocus | null;
    created_at: string;
    updated_at: string;
}

export interface UserStreak {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: string;
    created_at: string;
    updated_at: string;
}
