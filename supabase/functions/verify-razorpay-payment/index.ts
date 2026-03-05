
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

        // We will insert/update the `payments` record to track this transaction securely
        const { error: paymentError } = await supabase
            .from("payments")
            .upsert({
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                status: "captured",
                updated_at: new Date().toISOString(),
            }, { onConflict: 'razorpay_order_id' });

        if (paymentError) {
            console.error("Error logging payment record:", paymentError);
            // Non-blocking but good to log
        }

        return new Response(
            JSON.stringify({ success: true, verified: true }),
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
