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
        const { userId, type, details } = await req.json();

        // details can be { upi_id: string } OR { bank_account_name, bank_account_number, bank_ifsc }
        // type should be 'vpa' or 'bank_account'

        if (!userId || !type || !details) {
            throw new Error("Missing required fields for fund account creation.");
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch user details
        const { data: userProfile, error: profileError } = await supabase
            .from("user_profiles")
            .select("first_name, last_name, email, phone, razorpay_contact_id, razorpay_fund_account_id")
            .eq("user_id", userId)
            .single();

        if (profileError || !userProfile) {
            throw new Error("User profile not found");
        }

        const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
        const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";

        // Authorization header format for Razorpay
        const token = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
        const authHeader = `Basic ${token}`;

        let contactId = userProfile.razorpay_contact_id;

        // 1. Create a Contact if they don't have one
        if (!contactId) {
            const contactPayload = {
                name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Freelancer',
                email: userProfile.email,
                contact: userProfile.phone || '',
                type: "vendor",
                reference_id: userId,
            };

            const contactRes = await fetch("https://api.razorpay.com/v1/contacts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader,
                },
                body: JSON.stringify(contactPayload),
            });

            const contactData = await contactRes.json();

            if (!contactRes.ok) {
                console.error("Razorpay Contact Error:", contactData);
                throw new Error(contactData.error?.description || "Failed to create Razorpay Contact");
            }

            contactId = contactData.id;
        }

        // 2. Create the Fund Account
        let fundAccountPayload: any = {
            contact_id: contactId,
            account_type: type,
        };

        if (type === "vpa") {
            fundAccountPayload.vpa = {
                address: details.upi_id
            };
        } else if (type === "bank_account") {
            fundAccountPayload.bank_account = {
                name: details.bank_account_name,
                ifsc: details.bank_ifsc,
                account_number: details.bank_account_number
            };
        } else {
            throw new Error("Invalid account type. Use 'vpa' or 'bank_account'");
        }

        const fundAccountRes = await fetch("https://api.razorpay.com/v1/fund_accounts", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": authHeader,
            },
            body: JSON.stringify(fundAccountPayload),
        });

        const fundAccountData = await fundAccountRes.json();

        if (!fundAccountRes.ok) {
            console.error("Razorpay Fund Account Error:", fundAccountData);
            throw new Error(fundAccountData.error?.description || "Failed to create Razorpay Fund Account");
        }

        const fundAccountId = fundAccountData.id;

        // 3. Update Supabase with the attached IDs
        const { error: updateError } = await supabase
            .from("user_profiles")
            .update({
                razorpay_contact_id: contactId,
                razorpay_fund_account_id: fundAccountId,
                upi_id: type === "vpa" ? details.upi_id : null,
                bank_account_name: type === "bank_account" ? details.bank_account_name : null,
                bank_account_number: type === "bank_account" ? details.bank_account_number : null,
                bank_ifsc: type === "bank_account" ? details.bank_ifsc : null,
            })
            .eq("user_id", userId);

        if (updateError) {
            console.error("Supabase Save Error:", updateError);
            throw new Error("Successfully created Razorpay accounts but failed to save them to the database.");
        }

        return new Response(
            JSON.stringify({
                success: true,
                contact_id: contactId,
                fund_account_id: fundAccountId,
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
