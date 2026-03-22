import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env', 'utf8') || fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').filter(l => l).reduce((a, l) => {
  const [k, ...v] = l.split('=');
  if (k && v) {
    a[k] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
  return a;
}, {});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log("Fetching distinct states...");
  let { data: states, error: sErr } = await supabase.rpc('get_college_states');
  console.log("get_college_states:", sErr ? sErr : states);

  console.log("\nFetching colleges for Tamil Nadu (ilike)...");
  let { data: tnFuzzy } = await supabase.from('colleges').select('id, name, state').ilike('state', '%Tamil%Nadu%').limit(5);
  console.log("ilike Tamil Nadu:", tnFuzzy);

  console.log("\nFetching colleges for Tamil Nadu (eq)...");
  let { data: tnEq } = await supabase.from('colleges').select('id, name, state').eq('state', 'Tamil Nadu').limit(5);
  console.log("eq Tamil Nadu:", tnEq);

  console.log("\nFetching colleges for Andhra Pradesh (ilike)...");
  let { data: apFuzzy } = await supabase.from('colleges').select('id, name, state').ilike('state', '%Andhra%Pradesh%').limit(5);
  console.log("ilike Andhra Pradesh:", apFuzzy);
}
test();
