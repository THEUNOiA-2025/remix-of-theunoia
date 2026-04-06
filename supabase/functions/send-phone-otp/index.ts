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

    // Send SMS via StartMessaging API
    const START_MESSAGING_API_KEY = Deno.env.get('START_MESSAGING_API_KEY')
    
    const smsResponse = await fetch('https://api.startmessaging.com/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': START_MESSAGING_API_KEY
      },
      body: JSON.stringify({
        phoneNumber: phone,
        templateId: Deno.env.get('START_MESSAGING_TEMPLATE_ID') || 'DEFAULT_TEMPLATE',
        variables: {
          otp: otp,
          appName: 'TheUnoia'
        }
      })
    })

    if (!smsResponse.ok) {
      const errorText = await smsResponse.text()
      console.error(`[StartMessaging API Error] ${smsResponse.status}: ${errorText}`)
    } else {
      console.log(`[StartMessaging] OTP sent successfully to ${phone}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'OTP sent successfully' }),
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
