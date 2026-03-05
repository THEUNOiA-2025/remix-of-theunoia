const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// ==========================================
// ⚠️ FILL IN YOUR REAL KEYS HERE FOR THE SCRIPT
// ==========================================
const SUPABASE_URL = "https://oeleyonqaowubcfreqoy.supabase.co";
const SUPABASE_SERVICE_KEY = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; // From Supabase Dashboard -> Settings -> API
const RAZORPAY_KEY_ID = "YOUR_RAZORPAY_KEY_ID";
const RAZORPAY_KEY_SECRET = "YOUR_RAZORPAY_KEY_SECRET";
// ==========================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const razorpayAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

async function makeRazorpayRequest(path, payload) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(payload);
        const options = {
            hostname: 'api.razorpay.com',
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${razorpayAuth}`,
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(json);
                    } else {
                        reject(new Error(json.error?.description || 'Razorpay API Error'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

async function syncUsers() {
    console.log("Starting Razorpay sync for existing users...");

    // Fetch all users who have some payment details but no Razorpay fund account yet
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, email, phone, upi_id, bank_account_name, bank_account_number, bank_ifsc, razorpay_contact_id, razorpay_fund_account_id')
        .is('razorpay_fund_account_id', null)
        .or('upi_id.neq.null,bank_account_number.neq.null');

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log(`Found ${users.length} users needing Razorpay fund accounts.`);

    for (const user of users) {
        try {
            console.log(`Processing user: ${user.email} (${user.user_id})`);

            let contactId = user.razorpay_contact_id;

            // 1. Create Contact if not exists
            if (!contactId) {
                const contactPayload = {
                    name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Freelancer',
                    email: user.email,
                    contact: user.phone || '',
                    type: "vendor",
                    reference_id: user.user_id,
                };
                const contactData = await makeRazorpayRequest('/v1/contacts', contactPayload);
                contactId = contactData.id;
                console.log(`  -> Created Contact: ${contactId}`);
            }

            // 2. Create Fund Account
            let fundAccountPayload = { contact_id: contactId };

            if (user.upi_id) {
                fundAccountPayload.account_type = "vpa";
                fundAccountPayload.vpa = { address: user.upi_id };
            } else if (user.bank_account_number && user.bank_ifsc) {
                fundAccountPayload.account_type = "bank_account";
                fundAccountPayload.bank_account = {
                    name: user.bank_account_name || `${user.first_name} ${user.last_name}`,
                    ifsc: user.bank_ifsc,
                    account_number: user.bank_account_number
                };
            } else {
                console.log(`  -> Skipped: Incomplete payment details.`);
                continue;
            }

            const fundData = await makeRazorpayRequest('/v1/fund_accounts', fundAccountPayload);
            const fundAccountId = fundData.id;
            console.log(`  -> Created Fund Account: ${fundAccountId}`);

            // 3. Update Database
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    razorpay_contact_id: contactId,
                    razorpay_fund_account_id: fundAccountId
                })
                .eq('user_id', user.user_id);

            if (updateError) throw updateError;

            console.log(`  -> Successfully synced to database!\n`);

        } catch (err) {
            console.error(`  -> Failed for ${user.email}:`, err.message, "\n");
        }
    }

    console.log("Sync complete!");
}

syncUsers();
