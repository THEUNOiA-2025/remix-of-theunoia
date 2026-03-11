# Financial System - Backend Requirements

> This document outlines all backend requirements for implementing the financial logic in the THEUNOiA freelancing platform.

---

## Table of Contents

1. [Database Tables](#1-database-tables)
2. [API Endpoints](#2-api-endpoints)
3. [Business Logic Functions](#3-business-logic-functions)
4. [External Integrations](#4-external-integrations)
5. [Cron Jobs / Scheduled Tasks](#5-cron-jobs--scheduled-tasks)
6. [Security Considerations](#6-security-considerations)
7. [Testing Requirements](#7-testing-requirements)

---

## 1. Database Tables

### 1.1 User Financial Profile

Extend the existing `user_profiles` table or create a new `user_financial_profiles` table.

```sql
-- Option A: Add columns to existing user_profiles table
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_gst_registered BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gstin_number VARCHAR(15);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS pan_verified BOOLEAN DEFAULT false;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS gstin_verified BOOLEAN DEFAULT false;
-- TDS Deductor status (CLIENT ONLY)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_tds_deductor BOOLEAN DEFAULT false;

-- Option B: Create separate table (recommended for cleaner separation)
CREATE TABLE user_financial_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pan_number VARCHAR(10) NOT NULL,
  pan_verified BOOLEAN DEFAULT false,
  is_gst_registered BOOLEAN DEFAULT false,
  gstin_number VARCHAR(15),
  gstin_verified BOOLEAN DEFAULT false,
  -- TDS Deductor status (CLIENT ONLY)
  -- If true, TDS will be deducted from freelancer payments
  -- If false, NO TDS will be applied regardless of threshold
  is_tds_deductor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id),
  UNIQUE(pan_number),
  UNIQUE(gstin_number)
);

-- Indexes
CREATE INDEX idx_user_financial_profiles_user_id ON user_financial_profiles(user_id);
CREATE INDEX idx_user_financial_profiles_pan ON user_financial_profiles(pan_number);
```

**IMPORTANT: TDS Deductor Logic**

TDS (Tax Deducted at Source) is ONLY applicable when:
1. The **client** has `is_tds_deductor = true` AND
2. Either:
   - Single payment > ₹30,000, OR
   - Cumulative payments to the same freelancer in the financial year > ₹30,000

If `is_tds_deductor = false`, TDS is NEVER calculated regardless of payment amount.

### 1.2 Contracts Table

```sql
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  bid_id UUID NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id),
  freelancer_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Contract Details
  contract_value DECIMAL(12, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, completed, cancelled, disputed
  
  -- Tax-related flags
  freelancer_gst_registered BOOLEAN DEFAULT false,
  client_gst_registered BOOLEAN DEFAULT false,
  -- IMPORTANT: Determines if TDS will be applied
  -- Copied from client's profile at contract creation time
  client_is_tds_deductor BOOLEAN DEFAULT false,
  
  -- Calculated amounts (stored for record-keeping)
  client_payable DECIMAL(12, 2) NOT NULL,       -- Total client pays
  client_platform_fee DECIMAL(12, 2) NOT NULL,  -- 3% of contract value
  client_platform_fee_gst DECIMAL(12, 2) NOT NULL, -- 18% GST on client platform fee
  freelancer_net_payout DECIMAL(12, 2) NOT NULL,   -- Net amount freelancer receives
  freelancer_platform_fee DECIMAL(12, 2) NOT NULL, -- 5% of contract value
  freelancer_platform_fee_gst DECIMAL(12, 2) NOT NULL, -- 18% GST on freelancer platform fee
  service_gst DECIMAL(12, 2),                   -- 18% GST on service (only if freelancer GST registered)
  total_tds DECIMAL(12, 2) DEFAULT 0,           -- Total TDS across all milestones (0 if client not TDS deductor)
  total_tcs DECIMAL(12, 2) DEFAULT 0,           -- Total TCS (1% of contract value)
  
  -- Timestamps
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contracts_project ON contracts(project_id);
CREATE INDEX idx_contracts_client ON contracts(client_id);
CREATE INDEX idx_contracts_freelancer ON contracts(freelancer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
```

### 1.3 Milestones Table

```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Milestone Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  phase_number INT NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL, -- Percentage of contract value
  amount DECIMAL(12, 2) NOT NULL,    -- Calculated amount for this milestone
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, submitted, approved, paid, disputed
  
  -- Dates
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Tax calculations for this milestone
  tds_applicable BOOLEAN DEFAULT false,
  tds_amount DECIMAL(12, 2) DEFAULT 0,
  tcs_amount DECIMAL(12, 2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_milestones_contract ON milestones(contract_id);
CREATE INDEX idx_milestones_status ON milestones(status);
```

### 1.4 Invoices Table

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  
  -- Invoice Type
  invoice_type VARCHAR(30) NOT NULL, -- 'freelancer_to_client', 'platform_to_client', 'platform_to_freelancer'
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  
  -- Parties
  from_user_id UUID REFERENCES auth.users(id),
  from_name VARCHAR(255) NOT NULL,
  from_pan VARCHAR(10),
  from_gstin VARCHAR(15),
  from_address TEXT,
  
  to_user_id UUID REFERENCES auth.users(id),
  to_name VARCHAR(255) NOT NULL,
  to_pan VARCHAR(10),
  to_gstin VARCHAR(15),
  to_address TEXT,
  
  -- Amounts
  subtotal DECIMAL(12, 2) NOT NULL,
  gst_amount DECIMAL(12, 2) DEFAULT 0,
  tds_amount DECIMAL(12, 2) DEFAULT 0,
  tcs_amount DECIMAL(12, 2) DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, issued, paid, cancelled
  issued_at TIMESTAMPTZ,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  
  -- Document
  pdf_url TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_invoices_contract ON invoices(contract_id);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
```

### 1.5 TDS Records Table

```sql
CREATE TABLE tds_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  milestone_id UUID REFERENCES milestones(id),
  
  -- Parties
  deductor_id UUID NOT NULL REFERENCES auth.users(id), -- Client (who deducts TDS)
  deductee_id UUID NOT NULL REFERENCES auth.users(id), -- Freelancer (from whom TDS is deducted)
  
  -- TDS Details
  financial_year VARCHAR(9) NOT NULL, -- '2025-2026'
  quarter VARCHAR(2) NOT NULL, -- 'Q1', 'Q2', 'Q3', 'Q4'
  section VARCHAR(10) DEFAULT '194J', -- TDS Section
  
  -- Amounts
  gross_amount DECIMAL(12, 2) NOT NULL,
  tds_rate DECIMAL(5, 2) DEFAULT 10.00,
  tds_amount DECIMAL(12, 2) NOT NULL,
  
  -- TDS Threshold Tracking
  triggered_by_single_payment BOOLEAN DEFAULT false, -- Payment > 30,000
  triggered_by_cumulative BOOLEAN DEFAULT false,      -- Cumulative > 30,000 in FY
  cumulative_amount_before DECIMAL(12, 2),           -- Cumulative before this payment
  cumulative_amount_after DECIMAL(12, 2),            -- Cumulative after this payment
  
  -- FD Tracking
  fd_created BOOLEAN DEFAULT false,
  fd_id UUID REFERENCES tds_fixed_deposits(id),
  
  -- Form 16A
  form_16a_uploaded BOOLEAN DEFAULT false,
  form_16a_upload_date TIMESTAMPTZ,
  form_16a_url TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'held', -- held, fd_created, form_16a_received, refunded_to_client, released_to_freelancer
  released_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tds_records_contract ON tds_records(contract_id);
CREATE INDEX idx_tds_records_deductor ON tds_records(deductor_id);
CREATE INDEX idx_tds_records_deductee ON tds_records(deductee_id);
CREATE INDEX idx_tds_records_fy ON tds_records(financial_year);
CREATE INDEX idx_tds_records_status ON tds_records(status);
```

### 1.6 TDS Cumulative Tracker Table

```sql
CREATE TABLE tds_cumulative_tracker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id),
  freelancer_id UUID NOT NULL REFERENCES auth.users(id),
  financial_year VARCHAR(9) NOT NULL, -- '2025-2026'
  
  -- Cumulative Amount
  cumulative_amount DECIMAL(12, 2) DEFAULT 0,
  threshold_breached BOOLEAN DEFAULT false,
  threshold_breached_at TIMESTAMPTZ,
  
  -- Last updated
  last_payment_date TIMESTAMPTZ,
  payment_count INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(client_id, freelancer_id, financial_year)
);

-- Indexes
CREATE INDEX idx_tds_cumulative_client ON tds_cumulative_tracker(client_id);
CREATE INDEX idx_tds_cumulative_freelancer ON tds_cumulative_tracker(freelancer_id);
CREATE INDEX idx_tds_cumulative_fy ON tds_cumulative_tracker(financial_year);
```

### 1.7 TDS Fixed Deposits Table

```sql
CREATE TABLE tds_fixed_deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tds_record_id UUID NOT NULL REFERENCES tds_records(id),
  
  -- FD Details
  principal_amount DECIMAL(12, 2) NOT NULL,
  interest_rate DECIMAL(5, 2), -- Annual interest rate
  maturity_period_days INT DEFAULT 30, -- 30 days + 5 working days buffer
  
  -- Dates
  created_at TIMESTAMPTZ DEFAULT now(),
  maturity_date DATE NOT NULL,
  actual_maturity_date DATE, -- Accounting for weekends/holidays
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, matured, released
  
  -- Interest (belongs to platform)
  accrued_interest DECIMAL(12, 2) DEFAULT 0,
  
  -- Resolution
  released_to VARCHAR(20), -- 'client' (form 16A uploaded) or 'freelancer' (maturity)
  released_at TIMESTAMPTZ,
  released_amount DECIMAL(12, 2),
  
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tds_fd_tds_record ON tds_fixed_deposits(tds_record_id);
CREATE INDEX idx_tds_fd_status ON tds_fixed_deposits(status);
CREATE INDEX idx_tds_fd_maturity ON tds_fixed_deposits(maturity_date);
```

### 1.8 TCS Records Table

```sql
CREATE TABLE tcs_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  milestone_id UUID REFERENCES milestones(id),
  
  -- TCS Details
  financial_year VARCHAR(9) NOT NULL,
  quarter VARCHAR(2) NOT NULL,
  
  -- Amounts
  contract_value DECIMAL(12, 2) NOT NULL,
  tcs_rate DECIMAL(5, 2) DEFAULT 1.00,
  tcs_amount DECIMAL(12, 2) NOT NULL,
  
  -- Credit belongs to freelancer
  freelancer_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Deposit Status (manual for now)
  deposited_to_govt BOOLEAN DEFAULT false,
  deposit_date DATE,
  challan_number VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tcs_records_contract ON tcs_records(contract_id);
CREATE INDEX idx_tcs_records_freelancer ON tcs_records(freelancer_id);
CREATE INDEX idx_tcs_records_fy ON tcs_records(financial_year);
```

### 1.9 Payments Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  milestone_id UUID REFERENCES milestones(id),
  
  -- Payment Details
  payment_type VARCHAR(30) NOT NULL, -- 'client_payment', 'freelancer_settlement'
  
  -- Parties
  payer_id UUID NOT NULL REFERENCES auth.users(id),
  payee_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Amounts
  gross_amount DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) DEFAULT 0,
  platform_fee_gst DECIMAL(12, 2) DEFAULT 0,
  service_gst DECIMAL(12, 2) DEFAULT 0,
  tds_amount DECIMAL(12, 2) DEFAULT 0,
  tcs_amount DECIMAL(12, 2) DEFAULT 0,
  net_amount DECIMAL(12, 2) NOT NULL,
  
  -- Payment Gateway
  gateway VARCHAR(20) DEFAULT 'razorpay',
  gateway_payment_id VARCHAR(255),
  gateway_order_id VARCHAR(255),
  gateway_signature VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed, refunded
  
  -- Timestamps
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_payments_contract ON payments(contract_id);
CREATE INDEX idx_payments_milestone ON payments(milestone_id);
CREATE INDEX idx_payments_payer ON payments(payer_id);
CREATE INDEX idx_payments_payee ON payments(payee_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_gateway ON payments(gateway_payment_id);
```

### 1.10 Settlements Table

```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  milestone_id UUID REFERENCES milestones(id),
  freelancer_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Settlement Details
  gross_amount DECIMAL(12, 2) NOT NULL,
  platform_fee DECIMAL(12, 2) NOT NULL,
  platform_fee_gst DECIMAL(12, 2) NOT NULL,
  tcs_deducted DECIMAL(12, 2) DEFAULT 0,
  tds_deducted DECIMAL(12, 2) DEFAULT 0,
  net_payout DECIMAL(12, 2) NOT NULL,
  
  -- Bank Details (from user profile)
  bank_account_number VARCHAR(20),
  bank_ifsc VARCHAR(11),
  bank_name VARCHAR(100),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  -- Transfer Details
  transfer_id VARCHAR(255), -- Bank transfer reference
  transferred_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_settlements_contract ON settlements(contract_id);
CREATE INDEX idx_settlements_freelancer ON settlements(freelancer_id);
CREATE INDEX idx_settlements_status ON settlements(status);
```

### 1.11 Platform Configuration Table

```sql
CREATE TABLE platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default values
INSERT INTO platform_config (key, value, description) VALUES
  ('client_fee_percentage', '3', 'Platform fee percentage for clients'),
  ('freelancer_fee_percentage', '5', 'Platform fee percentage for freelancers'),
  ('gst_rate', '18', 'GST rate percentage'),
  ('tds_rate', '10', 'TDS rate percentage under section 194J'),
  ('tcs_rate', '1', 'TCS rate percentage'),
  ('tds_single_threshold', '30000', 'TDS threshold for single payment'),
  ('tds_cumulative_threshold', '30000', 'TDS threshold for cumulative payments in FY'),
  ('fd_maturity_days', '30', 'FD maturity period in days'),
  ('fd_buffer_days', '5', 'Buffer days after FD maturity for form 16A upload');
```

---

## 2. API Endpoints

### 2.1 Financial Profile APIs

```
POST   /api/financial/profile
       - Create/update user financial profile (PAN, GSTIN)
       
GET    /api/financial/profile/:userId
       - Get user's financial profile
       
POST   /api/financial/validate-pan
       - Validate PAN format and check for duplicates
       
POST   /api/financial/validate-gstin
       - Validate GSTIN format and cross-check with PAN
```

### 2.2 Contract APIs

```
POST   /api/contracts
       - Create contract when bid is accepted
       - Generates all invoices
       - Creates milestone breakdown
       
GET    /api/contracts/:id
       - Get contract details with all calculations
       
GET    /api/contracts/:id/breakdown
       - Get detailed payment breakdown for contract
       
PUT    /api/contracts/:id/status
       - Update contract status
```

### 2.3 Milestone APIs

```
GET    /api/contracts/:contractId/milestones
       - Get all milestones for a contract
       
PUT    /api/milestones/:id/status
       - Update milestone status (submit, approve, etc.)
       
POST   /api/milestones/:id/payment
       - Initiate payment for milestone
```

### 2.4 Payment APIs

```
POST   /api/payments/initiate
       - Create Razorpay order for client payment
       
POST   /api/payments/verify
       - Verify Razorpay payment signature
       
POST   /api/payments/webhook
       - Razorpay webhook handler
       
GET    /api/payments/:id
       - Get payment details
       
GET    /api/payments/history/:userId
       - Get payment history for user
```

### 2.5 TDS APIs

```
GET    /api/tds/records/:contractId
       - Get TDS records for a contract
       
GET    /api/tds/cumulative/:clientId/:freelancerId
       - Get cumulative TDS tracker for client-freelancer pair
       
POST   /api/tds/form-16a/:tdsRecordId
       - Upload Form 16A document
       
GET    /api/tds/pending-releases
       - Get TDS records pending release (admin)
       
POST   /api/tds/release/:tdsRecordId
       - Release TDS amount (to client or freelancer)
```

### 2.6 Invoice APIs

```
GET    /api/invoices/:id
       - Get invoice details
       
GET    /api/invoices/:id/pdf
       - Generate/download invoice PDF
       
GET    /api/invoices/contract/:contractId
       - Get all invoices for a contract
       
GET    /api/invoices/user/:userId
       - Get all invoices for a user
```

### 2.7 Settlement APIs

```
GET    /api/settlements/pending
       - Get pending settlements for a freelancer
       
POST   /api/settlements/:id/process
       - Process freelancer settlement (admin)
       
GET    /api/settlements/history/:freelancerId
       - Get settlement history
```

### 2.8 Calculation Preview APIs

```
POST   /api/calculate/freelancer-payout
       - Preview freelancer payout breakdown
       Body: { contractValue, freelancerGSTRegistered, clientId?, freelancerId? }
       
POST   /api/calculate/client-payable
       - Preview client payable breakdown
       Body: { contractValue, freelancerGSTRegistered, clientGSTRegistered }
       
POST   /api/calculate/milestone-breakdown
       - Preview milestone-wise breakdown
       Body: { contractValue, phases[], freelancerGSTRegistered }
```

---

## 3. Business Logic Functions

### 3.1 TDS Threshold Check Function

**IMPORTANT: TDS is ONLY applicable if the client is a TDS Deductor.**

```typescript
// Supabase Edge Function or PostgreSQL Function
async function checkTDSApplicability(
  clientId: string,
  freelancerId: string,
  paymentAmount: number,
  financialYear: string
): Promise<{
  applicable: boolean;
  reason: 'single_payment' | 'cumulative' | 'below_threshold' | 'client_not_tds_deductor';
  cumulativeAmount: number;
}> {
  // FIRST: Check if client is a TDS deductor
  const clientProfile = await getClientFinancialProfile(clientId);
  
  // If client is NOT a TDS deductor, TDS NEVER applies
  if (!clientProfile.is_tds_deductor) {
    return { 
      applicable: false, 
      reason: 'client_not_tds_deductor', 
      cumulativeAmount: 0 
    };
  }
  
  // Client IS a TDS deductor - proceed with threshold checks
  
  // 1. Check if single payment > 30,000
  if (paymentAmount > 30000) {
    return { applicable: true, reason: 'single_payment', cumulativeAmount: 0 };
  }
  
  // 2. Get cumulative amount for this client-freelancer pair in FY
  const cumulative = await getCumulativeAmount(clientId, freelancerId, financialYear);
  const newCumulative = cumulative + paymentAmount;
  
  // 3. Check if cumulative crosses 30,000
  if (newCumulative > 30000 && cumulative <= 30000) {
    return { applicable: true, reason: 'cumulative', cumulativeAmount: newCumulative };
  }
  
  // 4. If already crossed threshold in previous payments
  if (cumulative > 30000) {
    return { applicable: true, reason: 'cumulative', cumulativeAmount: newCumulative };
  }
  
  return { applicable: false, reason: 'below_threshold', cumulativeAmount: newCumulative };
}

// Helper function to get client's financial profile
async function getClientFinancialProfile(clientId: string) {
  const { data, error } = await supabase
    .from('user_financial_profiles')
    .select('is_tds_deductor')
    .eq('user_id', clientId)
    .single();
  
  if (error) throw error;
  return data;
}
```

### 3.2 Invoice Generation Function

```typescript
async function generateInvoicesForContract(contractId: string): Promise<Invoice[]> {
  const contract = await getContract(contractId);
  const invoices: Invoice[] = [];
  
  // 1. Freelancer → Client Invoice (Service Invoice)
  invoices.push({
    invoice_type: 'freelancer_to_client',
    invoice_number: generateInvoiceNumber('FC'),
    from_user_id: contract.freelancer_id,
    to_user_id: contract.client_id,
    subtotal: contract.contract_value,
    gst_amount: contract.service_gst || 0,
    total_amount: contract.contract_value + (contract.service_gst || 0),
  });
  
  // 2. Platform → Client Invoice (Platform Fee)
  invoices.push({
    invoice_type: 'platform_to_client',
    invoice_number: generateInvoiceNumber('PC'),
    from_name: 'THEUNOiA Platform',
    to_user_id: contract.client_id,
    subtotal: contract.client_platform_fee,
    gst_amount: contract.client_platform_fee_gst,
    total_amount: contract.client_platform_fee + contract.client_platform_fee_gst,
  });
  
  // 3. Platform → Freelancer Invoice (Platform Fee Deduction)
  invoices.push({
    invoice_type: 'platform_to_freelancer',
    invoice_number: generateInvoiceNumber('PF'),
    from_name: 'THEUNOiA Platform',
    to_user_id: contract.freelancer_id,
    subtotal: contract.freelancer_platform_fee,
    gst_amount: contract.freelancer_platform_fee_gst,
    total_amount: contract.freelancer_platform_fee + contract.freelancer_platform_fee_gst,
  });
  
  return invoices;
}
```

### 3.3 FD Maturity Check Function

```typescript
async function checkAndReleaseMatureFDs(): Promise<void> {
  const today = new Date();
  
  // Get all matured FDs that haven't been released
  const maturedFDs = await db.query(`
    SELECT * FROM tds_fixed_deposits
    WHERE status = 'active'
    AND actual_maturity_date <= $1
  `, [today]);
  
  for (const fd of maturedFDs) {
    const tdsRecord = await getTDSRecord(fd.tds_record_id);
    
    if (tdsRecord.form_16a_uploaded) {
      // Release to client (refund)
      await releaseFDToClient(fd, tdsRecord);
    } else {
      // Release to freelancer
      await releaseFDToFreelancer(fd, tdsRecord);
    }
  }
}
```

### 3.4 Financial Year Utility Function

```typescript
function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed
  
  // FY starts April 1st (month = 3)
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}

function getQuarter(date: Date): string {
  const month = date.getMonth();
  if (month >= 3 && month <= 5) return 'Q1'; // Apr-Jun
  if (month >= 6 && month <= 8) return 'Q2'; // Jul-Sep
  if (month >= 9 && month <= 11) return 'Q3'; // Oct-Dec
  return 'Q4'; // Jan-Mar
}
```

---

## 4. External Integrations

### 4.1 Razorpay Integration

```typescript
// Required for payment collection from clients
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create order
async function createPaymentOrder(amount: number, currency: string = 'INR') {
  return await razorpay.orders.create({
    amount: amount * 100, // Razorpay expects paise
    currency,
    receipt: generateReceiptId(),
  });
}

// Verify payment
function verifyPayment(orderId: string, paymentId: string, signature: string): boolean {
  const generated = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return generated === signature;
}
```

### 4.2 Bank Transfer Integration (for Settlements)

```typescript
// For automated freelancer settlements (future)
// Options: Razorpay Payouts, ICICI API, etc.

interface BankTransferRequest {
  beneficiaryName: string;
  accountNumber: string;
  ifscCode: string;
  amount: number;
  narration: string;
}

async function initiateSettlementTransfer(request: BankTransferRequest): Promise<TransferResponse> {
  // Implementation depends on chosen banking partner
}
```

### 4.3 PDF Generation (for Invoices)

```typescript
// Use libraries like puppeteer, pdfkit, or jspdf
async function generateInvoicePDF(invoice: Invoice): Promise<Buffer> {
  // Generate PDF from invoice data
  // Store in Supabase Storage
  // Return URL
}
```

---

## 5. Cron Jobs / Scheduled Tasks

### 5.1 Daily Jobs

```typescript
// Run daily at 00:00 IST

// 1. Check FD Maturities
schedule('0 0 * * *', async () => {
  await checkAndReleaseMatureFDs();
});

// 2. Send TDS Reminder Emails
schedule('0 9 * * *', async () => {
  // Remind clients about pending Form 16A uploads
  await sendForm16AReminderEmails();
});
```

### 5.2 Quarterly Jobs

```typescript
// Run at end of each quarter

// 1. Generate TDS Summary Reports
schedule('0 0 1 4,7,10,1 *', async () => {
  await generateQuarterlyTDSReport();
});

// 2. Generate TCS Summary Reports
schedule('0 0 1 4,7,10,1 *', async () => {
  await generateQuarterlyTCSReport();
});
```

### 5.3 Financial Year End Jobs

```typescript
// Run on March 31st

// 1. Reset cumulative trackers for new FY
schedule('0 0 1 4 *', async () => {
  await initializeNewFinancialYear();
});
```

---

## 6. Security Considerations

### 6.1 PAN/GSTIN Data Protection

- Store PAN/GSTIN in encrypted format at rest
- Mask PAN in UI (show only last 4 characters)
- Implement audit logging for all financial data access
- Use Row Level Security (RLS) for financial tables

```sql
-- RLS Policy Example
ALTER TABLE user_financial_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own financial profile"
ON user_financial_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own financial profile"
ON user_financial_profiles FOR UPDATE
USING (auth.uid() = user_id);
```

### 6.2 Payment Security

- Never store full card details
- Use Razorpay's secure checkout
- Verify all payment signatures server-side
- Implement idempotency keys for payment operations

### 6.3 Admin Access Controls

- Implement role-based access for financial operations
- Require 2FA for admin financial actions
- Log all admin actions with timestamp and IP

---

## 7. Testing Requirements

### 7.1 Unit Tests

- TDS threshold calculation
- Financial year/quarter utilities
- Invoice amount calculations
- PAN/GSTIN validation

### 7.2 Integration Tests

- Contract creation with all invoices
- Payment flow (Razorpay mock)
- TDS record creation and tracking
- FD lifecycle (creation → maturity → release)

### 7.3 Edge Cases to Test

- Payment crossing FY boundary
- TDS threshold breach mid-contract
- Multiple concurrent milestones
- Form 16A upload exactly at FD maturity
- Freelancer with/without GST registration
- Contract cancellation after partial payment

### 7.4 Data Integrity Tests

- Invoice totals match contract values
- TDS cumulative tracker accuracy
- Settlement amounts match expected calculations

---

## Environment Variables Required

```env
# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Platform Configuration
PLATFORM_GSTIN=
PLATFORM_PAN=
PLATFORM_NAME=THEUNOiA

# Database (already configured in Supabase)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Implementation Priority

1. **Phase 1 - Core Tables & APIs**
   - User financial profiles (PAN/GSTIN)
   - Contracts & Milestones tables
   - Basic calculation APIs

2. **Phase 2 - Payment Flow**
   - Razorpay integration
   - Payment processing
   - Invoice generation

3. **Phase 3 - Tax Compliance**
   - TDS tracking & threshold logic
   - TCS records
   - Form 16A upload

4. **Phase 4 - Settlements**
   - Freelancer settlement processing
   - FD maturity handling
   - Automated releases

5. **Phase 5 - Reporting**
   - Admin dashboard
   - Quarterly reports
   - Tax filing support

---

*Document Version: 1.0*
*Last Updated: February 6, 2026*
*Author: AI Assistant*
