
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
        const { projectId, amount, bidId, paymentType, phaseId } = await req.json();

        if (!projectId || !amount) {
            throw new Error("Project ID and Amount are required");
        }

        // Initialize Supabase client (fallback to VITE_ prefixed vars)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let clientId = null;
        let freelancerId = null;

        // Fetch project details to verify existence (only if projectId is provided)
        if (projectId) {
            const { data: project, error: projectError } = await supabase
                .from("user_projects")
                .select("id, user_id")
                .eq("id", projectId)
                .single();

            if (projectError || !project) {
                throw new Error("Project not found");
            }
            clientId = project.user_id;

            if (bidId) {
                const { data: bid } = await supabase.from("bids").select("freelancer_id").eq("id", bidId).single();
                if (bid) freelancerId = bid.freelancer_id;
            } else {
                const { data: acceptedBid } = await supabase.from("bids").select("freelancer_id").eq("project_id", projectId).eq("status", "accepted").single();
                if (acceptedBid) freelancerId = acceptedBid.freelancer_id;
            }
        }

        // Calculate GST dynamically
        let subtotal = Number(amount);
        let gstAmount = 0;
        let totalAmount = subtotal;

        if (freelancerId) {
            const { data: freelancer } = await supabase.from("user_profiles").select("gstin").eq("user_id", freelancerId).single();
            if (freelancer && freelancer.gstin && freelancer.gstin.trim() !== '') {
                // Freelancer holds a valid GSTIN; add 18% GST to the phase amount
                gstAmount = Number((subtotal * 0.18).toFixed(2));
                totalAmount = Number((subtotal + gstAmount).toFixed(2));
            }
        }


        // Initialize Razorpay
        const instance = new Razorpay({
            key_id: Deno.env.get("RAZORPAY_KEY_ID") ?? "",
            key_secret: Deno.env.get("RAZORPAY_KEY_SECRET") ?? "",
        });

        const amountInPaise = Math.round(parseFloat(Number(totalAmount).toFixed(2)) * 100);
        const currency = "INR";

        // Receipt length must not exceed 40 characters
        const rawReceipt = `rcpt_${bidId || projectId || 'unknown'}_${Date.now()}`;
        const sanitizedReceipt = rawReceipt.substring(0, 40);

        const options = {
            amount: amountInPaise,
            currency,
            receipt: sanitizedReceipt,
            notes: {
                projectId: projectId || '',
                bidId: bidId || '',
                paymentType: paymentType || '',
                phaseId: phaseId || '',
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
                amount: totalAmount, // Use the total amount with GST
                currency: currency,
                status: "pending",
                razorpay_order_id: order.id,
                metadata: {
                    paymentType: paymentType || null,
                    bidId: bidId || null,
                    phaseId: phaseId || null,
                }
            });

        if (paymentError) {
            console.error("Error creating payment record:", paymentError);
            throw new Error("Failed to create payment record");
        }

        // Generate a Pending Invoice
        const invoiceNumber = `INV-${Date.now()}`;
        if (clientId && freelancerId) {
            const { error: invoiceError } = await supabase
                .from("invoices")
                .insert({
                    project_id: projectId,
                    client_id: clientId,
                    freelancer_id: freelancerId,
                    amount: totalAmount,
                    currency: currency,
                    status: "pending",
                    invoice_number: invoiceNumber,
                    invoice_type: paymentType === 'advance' ? 'advance_payment' : 'phase_payment',
                    phase_id: phaseId || null,
                    subtotal_amount: subtotal,
                    gst_amount: gstAmount,
                    total_amount: totalAmount
                });
            
            if (invoiceError) {
                console.error("Error generating pending invoice:", invoiceError);
                // Do not throw, allow order to proceed even if invoice generation fails non-critically
            }
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
