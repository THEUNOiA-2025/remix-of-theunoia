import { supabase } from "@/integrations/supabase/client";

export interface Bid {
    id: string;
    project_id: string;
    freelancer_id: string;
    amount: number;
    proposal: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    project?: {
        title: string;
        budget: number;
        status: string;
    };
}

export class BidService {
    /**
     * Places a bid on a project.
     * Note: This should ideally be a database transaction to ensure credit deduction works.
     * For now, we will use the existing direct insert but wrap it here.
     */
    static async placeBid(bidData: {
        project_id: string;
        freelancer_id: string;
        amount: number;
        proposal: string;
    }) {
        // Check for existing bid first
        const { data: existingBid, error: checkError } = await supabase
            .from("bids")
            .select("id")
            .eq("project_id", bidData.project_id)
            .eq("freelancer_id", bidData.freelancer_id)
            .maybeSingle();

        if (checkError) throw checkError;
        if (existingBid) throw new Error("You have already placed a bid on this project");

        // Insert new bid
        const { data, error } = await supabase
            .from("bids")
            .insert({
                ...bidData,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Fetches all bids placed by a specific freelancer.
     */
    static async getFreelancerBids(freelancerId: string) {
        const { data, error } = await supabase
            .from("bids")
            .select(`
                *,
                project:user_projects(id, title, budget, status, description, category, subcategory)
            `)
            .eq("freelancer_id", freelancerId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as unknown as Bid[];
    }

    /**
     * Accepts a bid and updates the project status to 'in_progress'.
     * This logic should ideally be an RPC to ensure atomicity.
     */
    static async acceptBid(bidId: string, projectId: string) {
        // 1. Update bid status to accepted
        const { error: bidError } = await supabase
            .from("bids")
            .update({ status: 'accepted' })
            .eq("id", bidId);

        if (bidError) throw bidError;

        // 2. Update project status to in_progress
        const { error: projectError } = await supabase
            .from("user_projects")
            .update({ status: 'in_progress' })
            .eq("id", projectId);

        if (projectError) throw projectError;
    }

    /**
     * Fetches all bids for a specific project.
     * Useful for clients to see who has bid on their project.
     */
    static async getProjectBids(projectId: string) {
        const { data, error } = await supabase
            .from("bids")
            .select(`
                *,
                freelancer:user_profiles!bids_freelancer_id_fkey(first_name, last_name, profile_picture_url)
            `)
            .eq("project_id", projectId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    }
}
