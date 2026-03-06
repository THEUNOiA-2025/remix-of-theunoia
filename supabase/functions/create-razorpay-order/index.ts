
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Razorpay from "npm:razorpay@2.9.2";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { projectId, amount, bidId } = await req.json();

        if (!projectId || !amount) {
            throw new Error("Project ID and Amount are required");
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch project details to verify existence
        const { data: project, error: projectError } = await supabase
            .from("user_projects")
            .select("id")
            .eq("id", projectId)
            .single();

        if (projectError || !project) {
            throw new Error("Project not found");
        }

        // Initialize Razorpay
        const instance = new Razorpay({
            key_id: Deno.env.get("RAZORPAY_KEY_ID") ?? "",
            key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") ?? "",
        });

        const amountInPaise = Math.round(parseFloat(Number(amount).toFixed(2)) * 100); // Razorpay strictly expects an integer in paise
        const currency = "INR";

        // Receipt length must not exceed 40 characters
        const rawReceipt = `rcpt_${bidId || projectId}_${Date.now()}`;
        const sanitizedReceipt = rawReceipt.substring(0, 40);

        const options = {
            amount: amountInPaise,
            currency,
            receipt: sanitizedReceipt,
            notes: {
                projectId: projectId,
                bidId: bidId || '',
            },
        };

        const order = await instance.orders.create(options);

        if (!order) {
            throw new Error("Failed to create Razorpay order");
        }

        // Save initial payment record
        const { error: paymentError } = await supabase
            .from("payments")
            .insert({
                project_id: projectId,
                amount: amount, // Use the amount passed in the request
                currency: currency,
                status: "pending",
                razorpay_order_id: order.id,
                bid_id: bidId || null,
            });

        if (paymentError) {
            console.error("Error creating payment record:", paymentError);
            throw new Error("Failed to create payment record");
        }

        return new Response(
            JSON.stringify(order),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );
    } catch (error: any) {
        console.error("Create Razorpay Order Error:", error);

        let errorMsg = error.message || "An unknown error occurred during order creation";

        // Sometimes Razorpay errors are deeply nested
        if (error.error && error.error.description) {
            errorMsg = error.error.description;
        }

        return new Response(
            JSON.stringify({ error: errorMsg }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
