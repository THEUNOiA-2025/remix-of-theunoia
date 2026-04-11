import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("Resend_API"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendCodeRequest {
  email: string;
}

const isLikelyInstitutionalEmail = (email: string) => {
  const lower = email.toLowerCase();
  return (
    lower.endsWith(".edu") ||
    lower.includes(".edu.") ||
    lower.includes(".ac.") ||
    lower.endsWith(".ac.in")
  );
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
    const supabaseAnonKey =
      Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Supabase env vars missing in Edge Function secrets" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error("User error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email }: SendCodeRequest = await req.json();

    // Validate email format
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailLower = email.toLowerCase().trim();
    if (!isLikelyInstitutionalEmail(emailLower)) {
      return new Response(
        JSON.stringify({ error: "Use your institutional email (.edu / .ac domain)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce 60-second cooldown per user+email
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentSend, error: recentSendError } = await supabase
      .from("email_verification_codes")
      .select("id")
      .eq("user_id", user.id)
      .eq("email", emailLower)
      .gte("created_at", oneMinuteAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentSendError) {
      console.error("Cooldown check error:", recentSendError);
      return new Response(
        JSON.stringify({ error: "Failed to process verification request" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recentSend) {
      return new Response(
        JSON.stringify({ error: "Please wait 60 seconds before requesting another code." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check rate limiting - max 3 codes per email per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentCodes, error: countError } = await supabase
      .from("email_verification_codes")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (countError) {
      console.error("Count error:", countError);
      return new Response(
        JSON.stringify({ error: "Failed to check rate limit" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (recentCodes && recentCodes.length >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many verification attempts. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Invalidate previous active codes to ensure latest-code-only verification
    const { error: invalidateError } = await supabase
      .from("email_verification_codes")
      .update({ invalidated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("email", emailLower)
      .is("verified_at", null)
      .is("invalidated_at", null);

    if (invalidateError) {
      console.error("Invalidate error:", invalidateError);
      return new Response(
        JSON.stringify({ error: "Failed to rotate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Store code in database
    const { error: insertError } = await supabase
      .from("email_verification_codes")
      .insert({
        user_id: user.id,
        email: emailLower,
        code,
        expires_at: expiresAt,
        attempt_count: 0,
        invalidated_at: null,
      });

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification code" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email via Resend
    const { data: emailData, error: sendError } = await resend.emails.send({
      from: "TheUnoia <noreply@theunoia.com>",
      to: [emailLower],
      subject: "Your Student Verification Code - TheUnoia",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0b0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b0f;padding:40px 20px;">
            <tr>
              <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#111118;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#7e63f8,#4f8cff);padding:32px 40px;border-radius:16px 16px 0 0;">
                      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">THEUNOiA Support</p>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#ffffff;">Verify Your Email</h1>
                      <p style="margin:0 0 32px 0;font-size:15px;color:#a1a1aa;line-height:1.6;">Use the verification code below to confirm your student email address.</p>
                      <!-- OTP Box -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding:0 0 32px 0;">
                            <div style="background-color:#0b0b0f;border:1px solid #1f1f28;border-radius:12px;padding:28px 24px;display:inline-block;">
                              <span style="font-family:'Courier New',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#ffffff;">${code}</span>
                            </div>
                          </td>
                        </tr>
                      </table>
                      <!-- Footer info -->
                      <p style="margin:0 0 6px 0;font-size:14px;color:#a1a1aa;">This code will expire in <strong style="color:#ffffff;">10 minutes</strong>.</p>
                      <p style="margin:0 0 32px 0;font-size:13px;color:#52525b;">If you didn't request this, you can safely ignore this email.</p>
                      <!-- Signature -->
                      <div style="border-top:1px solid #1f1f28;padding-top:24px;">
                        <p style="margin:0;font-size:13px;color:#52525b;">— THEUNOiA Support Team</p>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (sendError) {
      console.error("Resend API Error:", sendError);
      return new Response(
        JSON.stringify({ error: sendError.message || "Failed to deliver email. Check Edge Function logs." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "Verification code sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-email-verification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
