import { supabase } from "@/integrations/supabase/client";
import { Task, TaskStatus } from "@/pages/shared/projects/ProjectTracking/types";
import { PhaseStatus, PhaseState } from "@/pages/shared/projects/ProjectTracking/phaseLockingTypes";
import { getPhasesForCategory } from "@/pages/shared/projects/ProjectTracking/phaseMapping";
import { Activity } from "@/pages/freelancer/projects/ProjectTracking/ProjectTrackingDashboard";

export class ProjectTrackingService {
    /**
     * Initialize phases for a project if they don't exist
     */
    static async initializePhases(projectId: string, category: string | null) {
        // Check if phases already exist
        const { count, error: countError } = await supabase
            .from('project_phases' as any)
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId);

        if (countError) throw countError;

        if (count && count > 0) return; // Already initialized

        // Get default phases for category
        const phaseNames = getPhasesForCategory(category);

        // Create phase records
        const phasesToInsert = phaseNames.map((name: string, index: number) => ({
            project_id: projectId,
            phase_name: name,
            phase_order: index + 1,
            // All phases are initially 'unlocked' for the initial setup phase
            status: 'unlocked',
            payment_status: 'unpaid',
            freelancer_approved: false,
            client_approved: false
        }));

        const { error: insertError } = await supabase
            .from('project_phases' as any)
            .insert(phasesToInsert);

        if (insertError) throw insertError;
    }

    /**
     * Get all phases for a project
     */
    static async getPhaseStates(projectId: string): Promise<PhaseState[]> {
        const { data, error } = await supabase
            .from('project_phases' as any)
            .select('*')
            .eq('project_id', projectId)
            .order('phase_order', { ascending: true });

        if (error) throw error;

        // Map to PhaseState interface (ensure types match)
        return data.map((p: any) => ({
            id: p.id,
            project_id: p.project_id,
            phase_name: p.phase_name,
            phase_order: p.phase_order,
            status: p.status as PhaseStatus,
            payment_status: p.payment_status,
            freelancer_approved: p.freelancer_approved,
            client_approved: p.client_approved,
            locked_at: p.locked_at,
            locked_by: p.locked_by,
            submission_message: p.submission_message,
            submission_attachments: p.submission_attachments,
            rejection_feedback: p.rejection_feedback,
            submitted_at: p.submitted_at,
            created_at: p.created_at,
            updated_at: p.updated_at
        }));
    }

    /**
     * Submit work for a phase (Freelancer)
     */
    static async submitPhaseWork(phaseId: string, message: string, attachments: any[] = []) {
        const { error } = await supabase
            .from('project_phases' as any)
            .update({
                freelancer_approved: true,
                submission_message: message,
                submission_attachments: attachments,
                submitted_at: new Date().toISOString(),
                // Clear any previous rejection
                rejection_feedback: null
            })
            .eq('id', phaseId);

        if (error) throw error;
    }

    /**
     * Reject work for a phase (Client)
     */
    static async rejectPhaseWork(phaseId: string, feedback: string) {
        const { error } = await supabase
            .from('project_phases' as any)
            .update({
                freelancer_approved: false,
                client_approved: false,
                rejection_feedback: feedback
            })
            .eq('id', phaseId);

        if (error) throw error;
    }

    /**
     * Update a phase state
     */
    static async updatePhaseState(phaseId: string, updates: Partial<PhaseState>) {
        // remove fields that shouldn't be updated directly or map them if needed
        const { id, project_id, created_at, ...updateData } = updates;

        const { error } = await supabase
            .from('project_phases' as any)
            .update(updateData)
            .eq('id', phaseId);

        if (error) throw error;
    }

    /**
     * Start the project workflow (initial setup complete)
     */
    static async startProjectWorkflow(projectId: string, phases: PhaseState[]) {
        const sortedPhases = [...phases].sort((a, b) => a.phase_order - b.phase_order);

        // Update all phases
        const updatePromises = sortedPhases.map((phase, index) => {
            return supabase
                .from('project_phases' as any)
                .update({
                    status: index === 0 ? 'active' : 'pending' // First phase is active, others are pending
                })
                .eq('id', phase.id);
        });

        await Promise.all(updatePromises);
    }

    /**
     * Get all tasks for a project
     */
    static async getTasks(projectId: string): Promise<Task[]> {
        const { data, error } = await supabase
            .from('project_tasks' as any)
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            assignee: t.assignee,
            deadline: t.deadline,
            priority: t.priority,
            status: t.status as TaskStatus,
            phase: t.phase,
            projectId: t.project_id,
            createdAt: t.created_at,
            updatedAt: t.updated_at
        }));
    }

    /**
     * Create a new task
     */
    static async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
        const { data, error } = await supabase
            .from('project_tasks' as any)
            .insert({
                project_id: task.projectId,
                phase: task.phase,
                title: task.title,
                description: task.description,
                assignee: task.assignee,
                deadline: task.deadline,
                priority: task.priority,
                status: task.status
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Update a task
     */
    static async updateTask(taskId: string, updates: Partial<Task>) {
        // Map frontend fields to backend
        const dbUpdates: any = {};
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.assignee !== undefined) dbUpdates.assignee = updates.assignee;
        if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
        if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
        if (updates.status !== undefined) dbUpdates.status = updates.status;
        if (updates.phase !== undefined) dbUpdates.phase = updates.phase;

        // Explicitly handle updatedAt
        dbUpdates.updated_at = new Date().toISOString();

        const { error } = await supabase
            .from('project_tasks' as any)
            .update(dbUpdates)
            .eq('id', taskId);

        if (error) throw error;
    }

    /**
     * Get activities for a project
     */
    static async getActivities(projectId: string): Promise<Activity[]> {
        const { data, error } = await supabase
            .from('project_activities' as any)
            .select('*')
            .eq('project_id', projectId)
            .order('timestamp', { ascending: false })
            .limit(50);

        if (error) throw error;

        return data.map((a: any) => ({
            id: a.id,
            userName: a.user_name,
            taskName: a.task_name,
            oldStatus: a.old_status,
            newStatus: a.new_status,
            phase: a.phase,
            timestamp: a.timestamp
        }));
    }

    /**
     * Log an activity
     */
    static async logActivity(projectId: string, activity: Omit<Activity, 'id' | 'timestamp'>) {
        const { error } = await supabase
            .from('project_activities' as any)
            .insert({
                project_id: projectId,
                user_name: activity.userName,
                task_name: activity.taskName,
                old_status: activity.oldStatus,
                new_status: activity.newStatus,
                phase: activity.phase,
                timestamp: new Date().toISOString()
            });

        if (error) throw error;
    }
    // MARK: - Project Completion

    static async getProjectDetails(projectId: string) {
        const { data, error } = await supabase
            .from('user_projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        return data;
    }

    static async submitProjectCompletion(projectId: string, message: string, attachments: any[] = []) {
        const { error } = await supabase.rpc('submit_project_completion', {
            p_project_id: projectId,
            p_message: message,
            p_attachments: attachments
        });

        if (error) throw error;
    }

    static async approveProjectCompletion(projectId: string) {
        const { error } = await supabase
            .from('user_projects')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
            } as any)
            .eq('id', projectId);

        if (error) throw error;
    }

    static async rejectProjectCompletion(projectId: string, reason: string) {
        // Fetch current completion data to preserve history if needed, or just overwrite/append
        // For now, we'll append the rejection reason to the current completion data

        // First get current data
        const { data: currentProject, error: fetchError } = await supabase
            .from('user_projects')
            .select('completion_data')
            .eq('id', projectId)
            .single();

        if (fetchError) throw fetchError;

        const updatedCompletionData = {
            ...((currentProject?.completion_data as any) || {}),
            rejection_reason: reason,
            rejected_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('user_projects')
            .update({
                status: 'in_progress', // Reset status so they can resume work/resubmit
                completion_data: updatedCompletionData,
            } as any)
            .eq('id', projectId);

        if (error) throw error;
    }
}
