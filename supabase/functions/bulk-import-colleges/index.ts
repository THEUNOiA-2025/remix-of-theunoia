import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { colleges } = await req.json();

    if (!colleges || !Array.isArray(colleges)) {
      return new Response(
        JSON.stringify({ error: 'Invalid data format. Expected { colleges: [...] }' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert in batches of 1000
    const batchSize = 1000;
    let totalInserted = 0;
    const errors: string[] = [];

    for (let i = 0; i < colleges.length; i += batchSize) {
      const batch = colleges.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('colleges')
        .insert(batch.map((c: any) => ({
          name: c.name || c.Name,
          state: c.state || c.State,
          city: c.city || c.CITY,
          country: c.country || c.Country || 'India',
          is_active: c.is_active === 'TRUE' || c.is_active === true
        })));

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        totalInserted += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalInserted,
        totalReceived: colleges.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
