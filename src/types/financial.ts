/**
 * Financial Type Definitions for THEUNOiA Platform
 * Types for payout calculations, invoices, and tax compliance
 */

// ============================================
// USER FINANCIAL PROFILE
// ============================================

export interface UserFinancialProfile {
  userId: string;
  panNumber: string | null;
  gstinNumber: string | null;
  isGSTRegistered: boolean;
  /** Billing address for invoices */
  billingAddress: string | null;
  /** 
   * Whether the user is a TDS deductor (CLIENT ONLY)
   * If true, TDS will be deducted from freelancer payments
   * If false, no TDS will be applied regardless of threshold
   */
  isTDSDeductor?: boolean;
}

// ============================================
// PAYOUT BREAKDOWN (Freelancer Side)
// ============================================

export interface PayoutBreakdown {
  /** Original contract/bid value */
  contractValue: number;
  
  /** GST on service (18%) - null if freelancer not GST registered */
  serviceGST: number | null;
  
  /** Gross amount (contract + GST if applicable) */
  grossAmount: number;
  
  /** Platform fee (5% of contract value) */
  platformFee: number;
  
  /** GST on platform fee (18% of platform fee) */
  platformFeeGST: number;
  
  /** TCS - Tax Collected at Source (1% of contract value) */
  tcs: number;
  
  /** TDS amount (10% of contract value) - null if threshold not crossed */
  tds: number | null;
  
  /** Whether TDS is applicable based on threshold */
  tdsApplicable: boolean;
  
  /** Reason for TDS applicability */
  tdsReason: TDSReason;
  
  /** Final net payout to freelancer */
  netPayout: number;
}

export type TDSReason = 
  | 'single_payment_exceeds_threshold'
  | 'cumulative_exceeds_threshold'
  | 'below_threshold'
  | 'not_applicable'
  | 'client_not_tds_deductor';

// ============================================
// PAYABLE BREAKDOWN (Client Side)
// ============================================

export interface PayableBreakdown {
  /** Original contract/service value */
  serviceValue: number;
  
  /** GST on service (18%) - null if freelancer not GST registered */
  serviceGST: number | null;
  
  /** Total service amount (value + GST if applicable) */
  totalServiceAmount: number;
  
  /** Platform fee (3% of contract value) */
  platformFee: number;
  
  /** GST on platform fee (18% of platform fee) */
  platformFeeGST: number;
  
  /** TDS amount held in FD (10% of contract value) - null if not applicable */
  tdsHeld: number | null;
  
  /** Whether TDS is being held */
  tdsApplicable: boolean;
  
  /** Total amount client needs to pay */
  totalPayable: number;
}

// ============================================
// MILESTONE PAYMENTS
// ============================================

export interface MilestonePayment {
  /** Index of the phase (0-based) */
  phaseIndex: number;
  
  /** Name of the phase */
  phaseName: string;
  
  /** Milestone amount (portion of contract value) */
  amount: number;
  
  /** Percentage of total contract */
  percentage: number;
  
  /** Whether TDS applies to this milestone */
  tdsApplicable: boolean;
  
  /** TDS amount for this milestone */
  tds: number;
  
  /** TCS amount for this milestone */
  tcs: number;
  
  /** GST on service for this milestone (if applicable) */
  serviceGST: number | null;
  
  /** Platform fee for this milestone */
  platformFee: number;
  
  /** GST on platform fee for this milestone */
  platformFeeGST: number;
  
  /** Net payout for this milestone */
  netPayout: number;
  
  /** Cumulative amount paid so far (including this milestone) */
  cumulativeAmount: number;
  
  /** Payment status */
  status: MilestoneStatus;
}

export type MilestoneStatus = 
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'paid';

// ============================================
// CONTRACT
// ============================================

export interface Contract {
  id: string;
  projectId: string;
  clientId: string;
  freelancerId: string;
  
  /** Total contract value (accepted bid amount) */
  contractValue: number;
  
  /** Is freelancer GST registered */
  freelancerGSTRegistered: boolean;
  
  /** Is client GST registered */
  clientGSTRegistered: boolean;
  
  /** Is client a TDS deductor - determines if TDS applies */
  clientIsTDSDeductor: boolean;
  
  /** Milestone breakdown */
  milestones: MilestonePayment[];
  
  /** Contract status */
  status: ContractStatus;
  
  /** Timestamps */
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

export type ContractStatus = 
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

// ============================================
// INVOICES
// ============================================

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  
  /** Type of invoice */
  type: InvoiceType;
  
  /** From party */
  from: InvoiceParty;
  
  /** To party */
  to: InvoiceParty;
  
  /** Line items */
  items: InvoiceLineItem[];
  
  /** Subtotal before tax */
  subtotal: number;
  
  /** Tax amount */
  taxAmount: number;
  
  /** Total amount */
  total: number;
  
  /** Invoice date */
  invoiceDate: string;
  
  /** Due date */
  dueDate: string;
  
  /** Status */
  status: InvoiceStatus;
}

export type InvoiceType = 
  | 'freelancer_to_client'    // Service invoice
  | 'platform_to_client'      // Platform fee invoice
  | 'platform_to_freelancer'; // Platform fee invoice

export interface InvoiceParty {
  name: string;
  address: string;
  panNumber: string | null;
  gstinNumber: string | null;
}

export interface InvoiceLineItem {
  description: string;
  amount: number;
  gstRate: number | null;
  gstAmount: number | null;
  total: number;
}

export type InvoiceStatus = 
  | 'draft'
  | 'generated'
  | 'sent'
  | 'paid';

// ============================================
// TDS TRACKING
// ============================================

export interface TDSRecord {
  id: string;
  contractId: string;
  milestoneIndex: number | null;
  clientId: string;
  freelancerId: string;
  
  /** TDS amount */
  amount: number;
  
  /** Financial year */
  financialYear: string;
  
  /** FD details */
  fdCreated: boolean;
  fdMaturityDate: string | null;
  
  /** Form 16A */
  form16AUploaded: boolean;
  form16AUploadedAt: string | null;
  form16AUrl: string | null;
  
  /** Status */
  status: TDSStatus;
  
  /** Timestamps */
  createdAt: string;
  releasedAt: string | null;
}

export type TDSStatus = 
  | 'held_in_fd'
  | 'released_to_freelancer'
  | 'refunded_to_client';

// ============================================
// TDS THRESHOLD TRACKING
// ============================================

export interface TDSThresholdTracker {
  clientId: string;
  freelancerId: string;
  financialYear: string;
  
  /** Cumulative amount paid */
  cumulativeAmount: number;
  
  /** Whether threshold has been crossed */
  thresholdCrossed: boolean;
  
  /** Date when threshold was first crossed */
  crossedAt: string | null;
}

// ============================================
// TCS TRACKING
// ============================================

export interface TCSRecord {
  id: string;
  contractId: string;
  milestoneIndex: number | null;
  freelancerId: string;
  
  /** TCS amount (1% of contract/milestone value) */
  amount: number;
  
  /** Financial year */
  financialYear: string;
  
  /** Deposited to government */
  deposited: boolean;
  depositedAt: string | null;
  
  /** Timestamps */
  createdAt: string;
}

// ============================================
// PAYMENT RECORDS
// ============================================

export interface PaymentRecord {
  id: string;
  contractId: string;
  milestoneIndex: number | null;
  
  /** Razorpay details */
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  
  /** Amount details */
  grossAmount: number;
  tdsAmount: number;
  netAmount: number;
  
  /** Status */
  status: PaymentStatus;
  
  /** Timestamps */
  createdAt: string;
  completedAt: string | null;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

// ============================================
// SETTLEMENT RECORDS
// ============================================

export interface SettlementRecord {
  id: string;
  contractId: string;
  milestoneIndex: number | null;
  freelancerId: string;
  
  /** Breakdown */
  grossAmount: number;
  platformFee: number;
  platformFeeGST: number;
  tcs: number;
  tds: number | null;
  netPayout: number;
  
  /** Status */
  status: SettlementStatus;
  
  /** Timestamps */
  createdAt: string;
  settledAt: string | null;
}

export type SettlementStatus = 
  | 'pending'
  | 'processing'
  | 'settled'
  | 'failed';

// ============================================
// BID SUBMISSION DATA
// ============================================

export interface BidSubmissionData {
  projectId: string;
  freelancerId: string;
  bidAmount: number;
  proposal: string;
  
  /** Financial agreement acceptance */
  agreementAccepted: boolean;
  agreementAcceptedAt: string;
  
  /** IP address for compliance */
  ipAddress: string;
  
  /** Calculated payout preview at time of submission */
  payoutPreview: PayoutBreakdown;
}

// ============================================
// CALCULATION INPUT PARAMS
// ============================================

export interface PayoutCalculationParams {
  contractValue: number;
  freelancerGSTRegistered: boolean;
  
  /** 
   * Is the client a TDS deductor?
   * If false, TDS will NOT be calculated regardless of threshold
   */
  clientIsTDSDeductor?: boolean;
  
  /** For TDS threshold check */
  clientId?: string;
  freelancerId?: string;
  
  /** Override TDS applicability (for mock/testing) */
  forceTDSApplicable?: boolean;
  
  /** Cumulative amount for threshold check */
  cumulativeAmount?: number;
}

export interface PayableCalculationParams {
  contractValue: number;
  freelancerGSTRegistered: boolean;
  
  /** 
   * Is the client a TDS deductor?
   * If false, TDS will NOT be calculated regardless of threshold
   */
  clientIsTDSDeductor?: boolean;
  
  /** For TDS threshold check */
  clientId?: string;
  freelancerId?: string;
  
  /** Override TDS applicability (for mock/testing) */
  forceTDSApplicable?: boolean;
}

export interface MilestoneCalculationParams {
  contractValue: number;
  phases: string[];
  freelancerGSTRegistered: boolean;
  
  /** 
   * Is the client a TDS deductor?
   * If false, TDS will NOT be calculated regardless of threshold
   */
  clientIsTDSDeductor?: boolean;
  
  /** Cumulative amount already paid (for TDS threshold) */
  cumulativeAmountPaid?: number;
}
