import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oeleyonqaowubcfreqoy.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbGV5b25xYW93dWJjZnJlcW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTAxODcsImV4cCI6MjA4Nzc4NjE4N30.aIYQY2KP0z9NNm3HF_LD9zT8b_y6GGQ3BQ8Xz3HqOAQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFetch() {
    console.log('Testing getOpenProjects logic...');
    const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .in("project_type", ["work_requirement", "client_project"])
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching projects:', error);
    } else {
        console.log('Successfully fetched projects (ignoring is_community_task constraint):');
        console.log(data);
    }

    // Now with is_community_task = false
    const { data: data2, error: error2 } = await supabase
        .from("user_projects")
        .select("*")
        .in("project_type", ["work_requirement", "client_project"])
        .eq("status", "open")
        .eq("is_community_task", false)
        .order("created_at", { ascending: false })
        .limit(5);

    if (error2) {
        console.error('Error fetching with is_community_task=false:', error2);
    } else {
        console.log('Successfully fetched projects with is_community_task=false:');
        console.log(`Count: ${data2.length}`);
    }
}

testFetch();
