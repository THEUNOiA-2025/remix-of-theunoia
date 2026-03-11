
import { supabase } from "@/integrations/supabase/client";

export class PaymentService {
    /**
     * Create a Razorpay order via Edge Function
     */
    static async createOrder(projectId: string) {
        const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
            body: { projectId }
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        return data;
    }

    /**
     * Verify a Razorpay payment via Edge Function
     */
    static async verifyPayment(response: any) {
        const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
            body: response
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        return data;
    }
}
