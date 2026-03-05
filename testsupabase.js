import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oeleyonqaowubcfreqoy.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbGV5b25xYW93dWJjZnJlcW95Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMTAxODcsImV4cCI6MjA4Nzc4NjE4N30.aIYQY2KP0z9NNm3HF_LD9zT8b_y6GGQ3BQ8Xz3HqOAQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testSignup() {
    const email = `testuser_${Date.now()}@example.com`;

    const metadata = {
        firstName: 'Test',
        lastName: 'User',
        userType: 'student',
        phone: '9999999999',
        signupIp: '127.0.0.1',
        signupDevice: 'Node Script',
        declarationsAccepted: true,
        consentVersion: 'v1.0',
        tdsConsentAccepted: false,
        dob: '2000-01-01',
        pan: 'ABCDE1234F',
        gstRegistered: false,
        gstin: null,
        gstState: null,
        bankName: 'Test Bank',
        bankAccNumber: '123456789',
        bankIfsc: 'SBIN0001234',
        upiId: null,
        skillsCategory: 'Dev',
        portfolioLink: 'https://example.com',
        educationLevel: 'BTech',
        collegeName: 'Test College',
    };

    console.log(`Testing signup with email: ${email}`);
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'Password123!',
        options: {
            data: metadata,
        },
    });

    if (error) {
        console.error('Signup Error Response:', error);
    } else {
        console.log('Signup Successful!');
        console.log('User created:', data.user?.id);

        // Check if profile was created
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user?.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error (it might not have been created):', profileError);
        } else {
            console.log('Profile created successfully:', profile);
        }
    }
}

testSignup();
