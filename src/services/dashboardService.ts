import { supabase } from "@/integrations/supabase/client";
import { UserTodo, UserWeeklyPlan, UserStreak, WeeklyFocus, WeeklyTask, TodoPriority } from "@/types/dashboard";

export class DashboardService {
    /**
     * Todos
     */
    static async getTodos(userId: string): Promise<UserTodo[]> {
        const { data, error } = await supabase
            .from('user_todos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(todo => ({
            ...todo,
            completed: todo.completed ?? false,
            priority: todo.priority as TodoPriority
        }));
    }

    static async addTodo(userId: string, text: string, priority: string): Promise<UserTodo> {
        const { data, error } = await supabase
            .from('user_todos')
            .insert({
                user_id: userId,
                text,
                priority,
                completed: false
            })
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            completed: data.completed ?? false,
            priority: data.priority as TodoPriority
        };
    }

    static async toggleTodo(todoId: string, completed: boolean): Promise<void> {
        const { error } = await supabase
            .from('user_todos')
            .update({ completed })
            .eq('id', todoId);

        if (error) throw error;
    }

    static async deleteTodo(todoId: string): Promise<void> {
        const { error } = await supabase
            .from('user_todos')
            .delete()
            .eq('id', todoId);

        if (error) throw error;
    }

    /**
     * Weekly Planner
     */
    static async getWeeklyPlans(userId: string, startDate: string, endDate: string): Promise<UserWeeklyPlan[]> {
        const { data, error } = await supabase
            .from('user_weekly_plans')
            .select('*')
            .eq('user_id', userId)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;

        return (data || []).map(plan => ({
            ...plan,
            tasks: (typeof plan.tasks === 'string' ? JSON.parse(plan.tasks) : plan.tasks) as WeeklyTask[],
            focus: plan.focus as WeeklyFocus
        }));
    }

    static async upsertWeeklyPlan(
        userId: string,
        date: string,
        tasks: WeeklyTask[],
        focus: WeeklyFocus | null
    ): Promise<UserWeeklyPlan> {
        // Check if plan exists for this date
        const { data: existing } = await supabase
            .from('user_weekly_plans')
            .select('*')
            .eq('user_id', userId)
            .eq('date', date)
            .single();

        if (existing) {
            const { data, error } = await supabase
                .from('user_weekly_plans')
                .update({
                    tasks: JSON.stringify(tasks), // Ensure JSON serialization
                    focus
                })
                .eq('id', existing.id)
                .select()
                .single();
            if (error) throw error;

            return {
                ...data,
                tasks: (typeof data.tasks === 'string' ? JSON.parse(data.tasks) : data.tasks) as WeeklyTask[],
                focus: data.focus as WeeklyFocus
            };
        } else {
            const { data, error } = await supabase
                .from('user_weekly_plans')
                .insert({
                    user_id: userId,
                    date,
                    tasks: JSON.stringify(tasks), // Ensure JSON serialization
                    focus
                })
                .select()
                .single();
            if (error) throw error;

            return {
                ...data,
                tasks: (typeof data.tasks === 'string' ? JSON.parse(data.tasks) : data.tasks) as WeeklyTask[],
                focus: data.focus as WeeklyFocus
            };
        }
    }

    /**
     * Streak
     */
    static async getStreak(userId: string): Promise<UserStreak | null> {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

        if (!data) return null;

        return {
            ...data,
            last_activity_date: data.last_activity_date || '' // Handle null date
        };
    }

    static async updateStreak(userId: string, currentStreak: number, lastActivityDate: string): Promise<UserStreak> {
        // Get existing to update longest_streak
        const existing = await this.getStreak(userId);
        const longest = existing ? Math.max(existing.longest_streak, currentStreak) : currentStreak;

        const { data, error } = await supabase
            .from('user_streaks')
            .upsert({
                user_id: userId,
                current_streak: currentStreak,
                longest_streak: longest,
                last_activity_date: lastActivityDate
            })
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            last_activity_date: data.last_activity_date || ''
        };
    }
}
