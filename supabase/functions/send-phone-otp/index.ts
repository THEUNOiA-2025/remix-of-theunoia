import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone) {
      return new Response(JSON.stringify({ error: 'Phone number is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Invalidate previous unverified OTPs for this phone
    await supabaseAdmin
      .from('otp_verifications')
      .update({ expires_at: new Date().toISOString() })
      .eq('phone', phone)
      .eq('verified', false)

    // Insert new OTP
    const { error } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone,
        otp,
        expires_at: expiresAt.toISOString(),
        verified: false
      })

    if (error) throw error

    // TODO: Integrate actual SMS provider here (Twilio, MSG91, Textlocal, Fast2SMS)
    // For now, we simulate sending by logging it to the console
    console.log(`[SIMULATED SMS to ${phone}] Your TheUnoia verification code is: ${otp}`)

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully (Simulated in logs)' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
