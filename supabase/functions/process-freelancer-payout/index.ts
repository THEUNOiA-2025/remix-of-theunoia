import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
        const { contractId } = await req.json();

        if (!contractId) {
            throw new Error("contractId is required");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
        const razorpayAuth = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;

        // 1. Fetch Contract & Freelancer Details
        const { data: contract, error: contractErr } = await supabase
            .from("contracts")
            .select("*, freelancer_id")
            .eq("id", contractId)
            .single();

        if (contractErr || !contract) throw new Error("Contract not found");

        const { data: profile, error: profileErr } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", contract.freelancer_id)
            .single();

        if (profileErr || !profile) throw new Error("Freelancer profile not found");

        // Calculate payout amount. 
        // Gross = contract_value. Platform fee = 5%. Net = Gross - Fee.
        const grossAmount = contract.contract_value;
        const platformFee = grossAmount * 0.05;
        const netPayout = grossAmount - platformFee;

        let fundAccountId = profile.razorpay_fund_account_id;

        // 2. The Smart Auto-Create Fallback
        if (!fundAccountId) {
            console.log(`Fund account missing for ${contract.freelancer_id}. Attempting auto-create...`);

            let contactId = profile.razorpay_contact_id;

            if (!contactId) {
                const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": razorpayAuth },
                    body: JSON.stringify({
                        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Freelancer',
                        email: profile.email,
                        contact: profile.phone || '',
                        type: "vendor",
                        reference_id: profile.user_id,
                    }),
                });
                const contactData = await contactRes.json();
                if (!contactRes.ok) throw new Error("Auto-create Contact failed: " + (contactData.error?.description || ""));
                contactId = contactData.id;
            }

            let type = "";
            let details = {};

            if (profile.upi_id) {
                type = "vpa";
                details = { vpa: { address: profile.upi_id } };
            } else if (profile.bank_account_number && profile.bank_ifsc) {
                type = "bank_account";
                details = {
                    bank_account: {
                        name: profile.bank_account_name || `${profile.first_name} ${profile.last_name}`,
                        ifsc: profile.bank_ifsc,
                        account_number: profile.bank_account_number
                    }
                };
            } else {
                throw new Error("Freelancer has not provided any Bank or UPI payout details in their profile. Cannot dispatch funds.");
            }

            const faRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": razorpayAuth },
                body: JSON.stringify({ contact_id: contactId, account_type: type, ...details }),
            });
            const faData = await faRes.json();
            if (!faRes.ok) throw new Error("Auto-create Fund Account failed: " + (faData.error?.description || ""));

            fundAccountId = faData.id;

            // Save back to Supabase forever
            await supabase.from("user_profiles").update({
                razorpay_contact_id: contactId,
                razorpay_fund_account_id: fundAccountId
            }).eq("user_id", profile.user_id);

            console.log(`Successfully auto-created and saved: ${fundAccountId}`);
        }

        // 3. Execute the RazorpayX Payout
        const accountNumber = Deno.env.get("RAZORPAYX_ACCOUNT_NUMBER");

        if (!accountNumber) {
            throw new Error("Missing RAZORPAYX_ACCOUNT_NUMBER environment variable. Real money transfers cannot be processed without it.");
        }

        const payoutPayload = {
            account_number: accountNumber,
            fund_account_id: fundAccountId,
            amount: Math.round(netPayout * 100), // Payouts expects values in paise
            currency: "INR",
            mode: "IMPS", // IMPS handles both UPI and Bank transfers instantly
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: `contract_${contractId}`,
            narration: "Freelance Project Payout"
        };

        const payoutRes = await fetch("https://api.razorpay.com/v1/payouts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": razorpayAuth,
            },
            body: JSON.stringify(payoutPayload),
        });

        const payoutData = await payoutRes.json();

        if (!payoutRes.ok) {
            console.error("Razorpay Payout Error:", payoutData);
            throw new Error(payoutData.error?.description || "Payout initiation failed");
        }

        // 4. Record the Settlement in the Database
        const { error: settlementErr } = await supabase.from("settlements").insert({
            contract_id: contractId,
            freelancer_id: contract.freelancer_id,
            gross_amount: grossAmount,
            platform_fee: platformFee,
            platform_fee_gst: 0, // Simplified for now since fee calculations are dynamic
            net_payout: netPayout,
            status: "processing", // Razorpay takes a few seconds to process IMPS
            transfer_id: payoutData.id,
        });

        if (settlementErr) {
            console.error("Failed to log settlement:", settlementErr);
            // Non-blocking but bad
        }

        return new Response(
            JSON.stringify({
                success: true,
                payout_id: payoutData.id,
                net_payout: netPayout,
                fund_account_id: fundAccountId
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            }
        );

    } catch (error) {
        console.error("Payout Exception:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            }
        );
    }
});
