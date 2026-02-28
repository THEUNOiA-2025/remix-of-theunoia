
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error("Missing payment verification details");
        }

        const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

        // Verify signature
        const text = razorpay_order_id + "|" + razorpay_payment_id;
        const hmac = createHmac("sha256", new TextEncoder().encode(key_secret));
        hmac.update(new TextEncoder().encode(text));
        const generated_signature = hmac.toString();

        if (generated_signature !== razorpay_signature) {
            throw new Error("Invalid payment signature");
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update payment record
        const { error: paymentError } = await supabase
            .from("payments")
            .update({
                status: "captured",
                razorpay_payment_id: razorpay_payment_id,
                updated_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", razorpay_order_id);

        if (paymentError) {
            console.error("Error updating payment record:", paymentError);
            throw new Error("Failed to update payment record");
        }

        // Get project_id from payment record
        const { data: paymentData, error: fetchError } = await supabase
            .from("payments")
            .select("project_id")
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (fetchError || !paymentData) {
            console.error("Error fetching payment record:", fetchError);
            throw new Error("Failed to fetch payment record");
        }

        // Update project status to completed
        const { error: projectError } = await supabase
            .from("user_projects")
            .update({
                status: "completed",
                completed_at: new Date().toISOString(),
            })
            .eq("id", paymentData.project_id);

        if (projectError) {
            console.error("Error updating project status:", projectError);
        }

        return new Response(
            JSON.stringify({ success: true }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
