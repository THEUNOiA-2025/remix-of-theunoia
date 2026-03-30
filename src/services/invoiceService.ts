import { supabase } from "@/integrations/supabase/client";

export interface Invoice {
    id: string;
    project_id: string;
    client_id: string;
    freelancer_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    due_date: string | null;
    created_at: string;
    invoice_number: string;
    invoice_type?: 'phase_payment' | 'advance_payment';
    phase_id?: string | null;
    subtotal_amount?: number;
    gst_amount?: number;
    total_amount?: number;
    project?: {
        title: string;
    };
}

export class InvoiceService {
    /**
     * Fetches invoices for a specific user (client or freelancer).
     * @param userId The user's ID.
     * @param role The role of the user ('client' or 'freelancer').
     * @returns List of invoices.
     */
    static async getInvoices(userId: string, role: 'client' | 'freelancer') {
        const column = role === 'client' ? 'client_id' : 'freelancer_id';

        // Note: We are selecting project title via relation. Ensure foreign key exists in Supabase.
        // If the foreign key relationship name differs, this might need adjustment (e.g., user_projects!invoices_project_id_fkey).
        // Assuming standard naming convention or simple relation if setup correctly.
        const { data, error } = await supabase
            .from('invoices' as any)
            .select(`
        *,
        project:user_projects(title)
      `)
            .eq(column, userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            // For now, if the table doesn't exist, return empty array to avoid crashing UI
            if (error.code === '42P01') { // undefined_table
                return [];
            }
            throw error;
        }

        return data || [];
    }

    /**
     * Updates the status of an invoice.
     * @param id Invoice ID.
     * @param status New status.
     */
    static async updateInvoiceStatus(id: string, status: 'pending' | 'paid' | 'overdue' | 'cancelled') {
        const { data, error } = await supabase
            .from('invoices' as any)
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
}
