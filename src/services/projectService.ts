import { supabase } from "@/integrations/supabase/client";

export interface ProjectFile {
    name: string;
    url: string;
    type: string;
    size: number;
}

export interface CreateProjectParams {
    user_id: string;
    title: string;
    description: string;
    category?: string | null;
    subcategory?: string | null;
    skills_required?: string[] | null;
    budget?: number | null;
    bidding_deadline?: string | null;
    project_type: 'client_project' | 'work_requirement' | 'portfolio_project';
    status: 'open' | 'in_progress' | 'completed';
    is_community_task?: boolean;
    image_url?: string | null;
    cover_image_url?: string | null;
    additional_images?: string[] | null;
    attached_files?: ProjectFile[] | null;
    rating?: number | null;
    client_feedback?: string | null;
    completed_at?: string | null;
}

export class ProjectService {
    /**
     * Uploads a file to Supabase Storage and returns the public URL and metadata.
     */
    static async uploadFile(file: File, bucket: 'project-images' | 'project-files'): Promise<ProjectFile | null> {
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error("User not authenticated");

            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return {
                name: file.name,
                url: publicUrl,
                type: file.type,
                size: file.size,
            };
        } catch (error) {
            console.error(`Error uploading file to ${bucket}:`, error);
            return null;
        }
    }

    /**
     * Creates a new project in the database.
     */
    static async createProject(projectData: CreateProjectParams) {
        // Cast attached_files to any to satisfy Supabase's Json type definition
        const payload = {
            ...projectData,
            attached_files: projectData.attached_files as unknown as any
        };

        const { data, error } = await supabase
            .from("user_projects")
            .insert(payload)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetches projects with optional filters.
     * Currently mimics the existing client-side logic regarding what to fetch, 
     * but prepares for server-side filtering.
     */
    static async getProjects(params?: {
        limit?: number;
        projectType?: string[];
        status?: string;
        isCommunityTask?: boolean;
    }) {
        let query = supabase
            .from("user_projects")
            .select("*")
            .order("created_at", { ascending: false });

        if (params?.projectType) {
            query = query.in("project_type", params.projectType);
        }
        if (params?.status) {
            query = query.eq("status", params.status);
        }
        if (params?.isCommunityTask !== undefined) {
            query = query.eq("is_community_task", params.isCommunityTask);
        }
        if (params?.limit) {
            query = query.limit(params.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }

    /**
     * Fetches projects that are open for bidding.
     */
    static async getOpenProjects() {
        const { data, error } = await supabase
            .from("user_projects")
            .select("*")
            .in("project_type", ["work_requirement", "client_project"])
            .eq("status", "open")
            .eq("is_community_task", false)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as any[];
    }

    /**
     * Fetches projects that are in progress (Working stage).
     * For freelancers: projects they have an accepted bid on.
     * For clients: projects they posted that are in progress.
     */
    static async getWorkingProjects(userId: string, role: 'client' | 'freelancer' | 'student') {
        if (role === 'client') {
            const { data, error } = await supabase
                .from("user_projects")
                .select("*")
                .eq("user_id", userId)
                .in("status", ["in_progress", "completion_requested"])
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        } else {
            // For freelancers/students, we need to find projects where they have an accepted bid
            const { data: bids, error: bidError } = await supabase
                .from("bids")
                .select("project_id")
                .eq("freelancer_id", userId)
                .eq("status", "accepted");

            if (bidError) throw bidError;

            if (!bids || bids.length === 0) return [];

            const projectIds = bids.map(b => b.project_id);

            const { data: projects, error: projectError } = await supabase
                .from("user_projects")
                .select("*")
                .in("id", projectIds)
                .in("status", ["in_progress", "completion_requested"]);

            if (projectError) throw projectError;
            return projects;
        }
    }

    /**
     * Fetches completed projects.
     */
    static async getCompletedProjects(userId: string, role: 'client' | 'freelancer' | 'student') {
        if (role === 'client') {
            const { data, error } = await supabase
                .from("user_projects")
                .select("*")
                .eq("user_id", userId)
                .eq("status", "completed")
                .order("completed_at", { ascending: false });

            if (error) throw error;
            return data;
        } else {
            // For freelancers/students: accepted bids on completed projects + portfolio projects
            const { data: bids, error: bidError } = await supabase
                .from("bids")
                .select("project_id")
                .eq("freelancer_id", userId)
                .eq("status", "accepted");

            if (bidError) throw bidError;

            const projectIds = bids?.map(b => b.project_id) || [];

            const { data: projects, error: projectError } = await supabase
                .from("user_projects")
                .select("*")
                .or(`id.in.(${projectIds.join(',')}),user_id.eq.${userId}`) // Worked on OR Portfolio
                .eq("status", "completed")
                .order("completed_at", { ascending: false });

            if (projectError) throw projectError;
            return projects;
        }
    }

    /**
     * Deletes a project by ID.
     */
    static async deleteProject(projectId: string) {
        const { error } = await supabase
            .from("user_projects")
            .delete()
            .eq("id", projectId);

        if (error) throw error;
    }
}
