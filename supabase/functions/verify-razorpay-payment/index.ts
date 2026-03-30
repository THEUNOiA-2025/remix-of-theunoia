
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifySignature(key_secret: string, razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string): Promise<boolean> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(key_secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const data = encoder.encode(razorpay_order_id + "|" + razorpay_payment_id);
    const signature = await crypto.subtle.sign("HMAC", key, data);
    const generated = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return generated === razorpay_signature;
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            phaseNames
        } = body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            throw new Error("Missing payment verification details");
        }

        const key_secret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

        // Verify signature using Web Crypto API
        const isValid = await verifySignature(key_secret, razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            throw new Error("Invalid payment signature");
        }

        // Initialize Supabase client (fallback to VITE_ prefixed vars)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") || Deno.env.get("VITE_SUPABASE_URL") || "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // 1. Fetch genuine metadata from our secure database instead of trusting client payload
        const { data: validPayment, error: queryError } = await supabase
            .from("payments")
            .select("project_id, amount, metadata")
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (queryError || !validPayment) {
            throw new Error("Payment record not found in system");
        }

        const projectId = validPayment.project_id;
        const paymentMetadata = validPayment.metadata || {};
        const paymentType = paymentMetadata.paymentType;
        const bidId = paymentMetadata.bidId;
        const phaseId = paymentMetadata.phaseId;
        const subtotal = paymentMetadata.subtotal || validPayment.amount;
        const gstAmount = paymentMetadata.gstAmount || 0;
        const clientId = paymentMetadata.clientId;
        const freelancerId = paymentMetadata.freelancerId;

        // 2. Mark payment as captured securely
        const { error: paymentError } = await supabase
            .from("payments")
            .update({
                razorpay_payment_id: razorpay_payment_id,
                status: "captured",
                updated_at: new Date().toISOString(),
            })
            .eq("razorpay_order_id", razorpay_order_id);

        if (paymentError) {
            console.error("Error logging payment record:", paymentError);
        }

        // 3. Create the Paid Invoice directly (no more pending invoices)
        if (clientId && freelancerId) {
            const invoiceNumber = `INV-${Date.now()}`;
            const { error: invoiceCreateError } = await supabase
                .from("invoices")
                .insert({
                    project_id: projectId,
                    client_id: clientId,
                    freelancer_id: freelancerId,
                    amount: validPayment.amount,
                    currency: "INR",
                    status: "paid", // Instant Paid Status
                    invoice_number: invoiceNumber,
                    invoice_type: paymentType === 'advance' ? 'advance_payment' : 'phase_payment',
                    phase_id: phaseId || null,
                    subtotal_amount: subtotal,
                    gst_amount: gstAmount,
                    total_amount: validPayment.amount
                });
            
            if (invoiceCreateError) {
                console.error("Failed to generate paid invoice:", invoiceCreateError);
            }
        }

        // 2. Automate Project Status and Bid Acceptance!
        if (projectId) {
            if (paymentType === 'advance' && bidId) {
                console.log(`Processing advance payment for project ${projectId} and bid ${bidId}...`);

                // 1. Accept the specific bid
                const { error: bidError } = await supabase
                    .from("bids")
                    .update({ status: 'accepted' })
                    .eq("id", bidId);

                if (bidError) {
                    console.error("Error accepting bid:", bidError);
                    throw new Error("Payment verified but failed to accept bid");
                }

                // 2. Reject other bids for the same project
                const { error: rejectError } = await supabase
                    .from("bids")
                    .update({ status: 'rejected' })
                    .eq("project_id", projectId)
                    .neq("id", bidId);

                if (rejectError) {
                    console.warn("Could not reject other bids:", rejectError);
                }

                // 3. Move project to in_progress
                const { error: projectError } = await supabase
                    .from("user_projects")
                    .update({
                        status: 'in_progress'
                    })
                    .eq("id", projectId);

                if (projectError) {
                    console.error("Error updating project status to in_progress:", projectError);
                    throw new Error("Payment verified but failed to update project status");
                }

                // 4. Ensure phases exist and mark initial ones as paid
                // Fetch project category to initialize phases if missing
                const { data: projectRow } = await supabase
                    .from("user_projects")
                    .select("category")
                    .eq("id", projectId)
                    .single();

                // Fetch existing phases
                let { data: phases } = await supabase
                    .from("project_phases")
                    .select("id, phase_order")
                    .eq("project_id", projectId)
                    .order("phase_order", { ascending: true });

                // If no phases, initialize them now
                if (!phases || phases.length === 0) {
                    console.log(`Initializing phases for project ${projectId} in edge function...`);
                    const category = projectRow?.category || null;

                    // Simplified phase mapping for Edge Function (Fallback)
                    const PHASE_MAPPING: Record<string, string[]> = {
                        "Writing & Content Creation": ["Drafting", "Refinement", "Finalization"],
                        "Graphic Design & Visual Arts": ["Drafting", "Refinement", "Finalization"],
                        "Web Development & Programming": ["Discovery", "Design", "Development", "Testing", "Finalization", "Support"],
                        "AI, Automation & Tech Tools": ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"],
                        "Medical Writing & Documentation": ["Discovery", "Drafting", "Refinement", "Testing", "Finalization", "Support"]
                    };
                    const DEFAULT_PHASES = ["Discovery", "Drafting", "Refinement", "Finalization"];

                    // Use passed phaseNames if available, otherwise fall back to mapping
                    const resolvedPhaseNames = phaseNames || ((category && PHASE_MAPPING[category]) ? PHASE_MAPPING[category] : DEFAULT_PHASES);

                    const phasesToInsert = resolvedPhaseNames.map((name: string, index: number) => ({
                        project_id: projectId,
                        phase_name: name,
                        phase_order: index + 1,
                        status: 'unlocked',
                        payment_status: 'unpaid',
                        freelancer_approved: false,
                        client_approved: false
                    }));

                    const { data: insertedPhases, error: insertError } = await supabase
                        .from("project_phases")
                        .insert(phasesToInsert)
                        .select("id, phase_order")
                        .order("phase_order", { ascending: true });

                    if (insertError) {
                        console.error("Error initializing phases in edge function:", insertError);
                    } else {
                        phases = insertedPhases;
                    }
                }

                if (phases && phases.length > 0) {
                    const totalPhases = phases.length;
                    const advancePhasesCount = totalPhases <= 4 ? 1 : 2;
                    const phaseIdsToMark = phases
                        .slice(0, advancePhasesCount)
                        .map((p: any) => p.id);

                    console.log(`Marking ${advancePhasesCount} phases as paid for project ${projectId}...`);
                    await supabase
                        .from("project_phases")
                        .update({ payment_status: 'paid' })
                        .in("id", phaseIdsToMark);
                }

                // Legacy pending invoice update has been moved to direct generation on line 94
            } else if (paymentType === 'phase') {
                console.log(`Processing phase payment for phase ${phaseId}...`);

                const { error: phaseError } = await supabase
                    .from("project_phases")
                    .update({ payment_status: 'paid' })
                    .eq("id", phaseId);

                if (phaseError) {
                    console.error("Error updating phase payment status:", phaseError);
                    throw new Error("Payment verified but failed to update phase status");
                }

                // Legacy pending invoice update has been moved to direct generation on line 94
            } else {
                // Legacy / Default logic: Completion payment (Project Status Update only)
                console.log(`Marking project ${projectId} as completed after payment verification...`);
                const { error: projectError } = await supabase
                    .from("user_projects")
                    .update({
                        status: 'completed',
                        completed_at: new Date().toISOString()
                    })
                    .eq("id", projectId);

                if (projectError) {
                    console.error("Error updating project status to completed:", projectError);
                    throw new Error("Payment verified but failed to update project status");
                }
            }
        }

        return new Response(
            JSON.stringify({ success: true, verified: true }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
