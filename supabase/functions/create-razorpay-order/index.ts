
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
        const { projectId } = await req.json();

        if (!projectId) {
            throw new Error("Project ID is required");
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch project details
        const { data: project, error: projectError } = await supabase
            .from("user_projects")
            .select("*")
            .eq("id", projectId)
            .single();

        if (projectError || !project) {
            throw new Error("Project not found");
        }

        if (!project.budget || project.budget <= 0) {
            throw new Error("Invalid project budget");
        }

        // Initialize Razorpay
        const instance = new Razorpay({
            key_id: Deno.env.get("RAZORPAY_KEY_ID") ?? "",
            key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") ?? "",
        });

        const amountInPaise = Math.round(project.budget * 100);
        const currency = "INR";

        const options = {
            amount: amountInPaise,
            currency,
            receipt: `receipt_${projectId}_${Date.now()}`,
            notes: {
                projectId: projectId,
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
                amount: project.budget,
                currency: currency,
                status: "pending",
                razorpay_order_id: order.id,
            });

        if (paymentError) {
            console.error("Error creating payment record:", paymentError);
            throw new Error("Failed to create payment record");
        }

        return new Response(
            JSON.stringify({
                order_id: order.id,
                amount: order.amount,
                currency: order.currency,
                key_id: Deno.env.get("RAZORPAY_KEY_ID"),
            }),
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
