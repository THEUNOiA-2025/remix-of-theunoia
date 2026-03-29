
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
        const body = await req.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            projectId,
            paymentType,
            bidId,
            phaseNames
        } = body;

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

        // 1. Log payment record securely
        const { error: paymentError } = await supabase
            .from("payments")
            .upsert({
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                project_id: projectId,
                status: "captured",
                updated_at: new Date().toISOString(),
            }, { onConflict: 'razorpay_order_id' });

        if (paymentError) {
            console.error("Error logging payment record:", paymentError);
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

                // Update Advance Payment Invoice to Paid
                const { error: invoiceUpdateError } = await supabase
                    .from("invoices")
                    .update({ status: 'paid' })
                    .eq("project_id", projectId)
                    .eq("invoice_type", "advance_payment")
                    .eq("status", "pending");
                    
                if (invoiceUpdateError) {
                    console.error("Error setting advance invoice to paid:", invoiceUpdateError);
                }
            } else if (paymentType === 'phase') {
                const { phaseId } = body;
                console.log(`Processing phase payment for phase ${phaseId}...`);

                const { error: phaseError } = await supabase
                    .from("project_phases")
                    .update({ payment_status: 'paid' })
                    .eq("id", phaseId);

                if (phaseError) {
                    console.error("Error updating phase payment status:", phaseError);
                    throw new Error("Payment verified but failed to update phase status");
                }

                // Update Phase Payment Invoice to Paid
                const { error: invoiceUpdateError } = await supabase
                    .from("invoices")
                    .update({ status: 'paid' })
                    .eq("project_id", projectId)
                    .eq("phase_id", phaseId)
                    .eq("status", "pending");
                    
                if (invoiceUpdateError) {
                    console.error("Error setting phase invoice to paid:", invoiceUpdateError);
                }
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
