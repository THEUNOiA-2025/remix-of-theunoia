/**
 * Financial Calculation Functions for THEUNOiA Platform
 * Pure TypeScript functions for all tax and payout calculations
 */

import { PLATFORM_FEES, TAX_RATES, TDS_THRESHOLD } from './constants';
import type {
  PayoutBreakdown,
  PayableBreakdown,
  MilestonePayment,
  PayoutCalculationParams,
  PayableCalculationParams,
  MilestoneCalculationParams,
  TDSReason,
} from '@/types/financial';

// ============================================
// FREELANCER PAYOUT CALCULATION
// ============================================

/**
 * Calculate the complete payout breakdown for a freelancer
 * Shows what freelancer will receive after all deductions
 * 
 * @param params - Calculation parameters
 * @returns Complete payout breakdown
 * 
 * @example
 * const payout = calculateFreelancerPayout({
 *   contractValue: 50000,
 *   freelancerGSTRegistered: true,
 *   forceTDSApplicable: true, // for testing
 * });
 * // Returns: { netPayout: 50550, ... }
 */
export function calculateFreelancerPayout(params: PayoutCalculationParams): PayoutBreakdown {
  const {
    contractValue,
    freelancerGSTRegistered,
    clientIsTDSDeductor = true, // Default to true for backward compatibility
    forceTDSApplicable,
    cumulativeAmount = 0,
  } = params;

  // 1. Calculate GST on service (only if freelancer is GST registered)
  const serviceGST = freelancerGSTRegistered 
    ? roundToTwo(contractValue * (TAX_RATES.GST / 100))
    : null;

  // 2. Calculate gross amount (contract value + GST if applicable)
  const grossAmount = serviceGST 
    ? roundToTwo(contractValue + serviceGST)
    : contractValue;

  // 3. Calculate platform fee (5% of contract value)
  const platformFee = roundToTwo(contractValue * (PLATFORM_FEES.FREELANCER_PERCENTAGE / 100));

  // 4. Calculate GST on platform fee (18% of platform fee)
  const platformFeeGST = roundToTwo(platformFee * (TAX_RATES.GST / 100));

  // 5. Calculate TCS (1% of contract value)
  const tcs = roundToTwo(contractValue * (TAX_RATES.TCS / 100));

  // 6. Determine TDS applicability
  // IMPORTANT: If client is NOT a TDS deductor, TDS never applies
  const { tdsApplicable, tdsReason } = checkTDSApplicability(
    contractValue,
    cumulativeAmount,
    forceTDSApplicable,
    clientIsTDSDeductor
  );

  // 7. Calculate TDS (10% of contract value) if applicable
  const tds = tdsApplicable 
    ? roundToTwo(contractValue * (TAX_RATES.TDS / 100))
    : null;

  // 8. Calculate net payout
  // Net = Gross - Platform Fee - GST on Platform Fee - TCS - TDS (if applicable)
  let netPayout = grossAmount - platformFee - platformFeeGST - tcs;
  if (tds !== null) {
    netPayout -= tds;
  }
  netPayout = roundToTwo(netPayout);

  return {
    contractValue,
    serviceGST,
    grossAmount,
    platformFee,
    platformFeeGST,
    tcs,
    tds,
    tdsApplicable,
    tdsReason,
    netPayout,
  };
}

// ============================================
// CLIENT PAYABLE CALCULATION
// ============================================

/**
 * Calculate the complete payable breakdown for a client
 * Shows what client needs to pay for a project/bid
 * 
 * @param params - Calculation parameters
 * @returns Complete payable breakdown
 * 
 * @example
 * const payable = calculateClientPayable({
 *   contractValue: 50000,
 *   freelancerGSTRegistered: true,
 *   forceTDSApplicable: true, // for testing
 * });
 * // Returns: { totalPayable: 60770, ... }
 */
export function calculateClientPayable(params: PayableCalculationParams): PayableBreakdown {
  const {
    contractValue,
    freelancerGSTRegistered,
    clientIsTDSDeductor = true, // Default to true for backward compatibility
    forceTDSApplicable,
  } = params;

  // 1. Service value is the contract value
  const serviceValue = contractValue;

  // 2. Calculate GST on service (only if freelancer is GST registered)
  const serviceGST = freelancerGSTRegistered 
    ? roundToTwo(contractValue * (TAX_RATES.GST / 100))
    : null;

  // 3. Calculate total service amount
  const totalServiceAmount = serviceGST 
    ? roundToTwo(serviceValue + serviceGST)
    : serviceValue;

  // 4. Calculate platform fee (3% of contract value)
  const platformFee = roundToTwo(contractValue * (PLATFORM_FEES.CLIENT_PERCENTAGE / 100));

  // 5. Calculate GST on platform fee (18% of platform fee)
  const platformFeeGST = roundToTwo(platformFee * (TAX_RATES.GST / 100));

  // 6. Determine TDS applicability
  // IMPORTANT: If client is NOT a TDS deductor, TDS never applies
  const { tdsApplicable } = checkTDSApplicability(
    contractValue,
    0, // Client doesn't need cumulative for their payable view
    forceTDSApplicable,
    clientIsTDSDeductor
  );

  // 7. Calculate TDS held (10% of contract value) if applicable
  const tdsHeld = tdsApplicable 
    ? roundToTwo(contractValue * (TAX_RATES.TDS / 100))
    : null;

  // 8. Calculate total payable
  // Total = Service + GST (if applicable) + Platform Fee + GST on Platform Fee
  // Note: TDS is included in total but goes to FD, not to freelancer directly
  const totalPayable = roundToTwo(totalServiceAmount + platformFee + platformFeeGST);

  return {
    serviceValue,
    serviceGST,
    totalServiceAmount,
    platformFee,
    platformFeeGST,
    tdsHeld,
    tdsApplicable,
    totalPayable,
  };
}

// ============================================
// MILESTONE BREAKDOWN CALCULATION
// ============================================

/**
 * Calculate payout breakdown for each milestone/phase
 * Handles TDS threshold check per milestone
 * 
 * @param params - Milestone calculation parameters
 * @returns Array of milestone payments with calculations
 */
export function calculateMilestoneBreakdown(params: MilestoneCalculationParams): MilestonePayment[] {
  const {
    contractValue,
    phases,
    freelancerGSTRegistered,
    clientIsTDSDeductor = true, // Default to true for backward compatibility
    cumulativeAmountPaid = 0,
  } = params;

  const numPhases = phases.length;
  if (numPhases === 0) return [];

  // Calculate amount per phase (equal split for now)
  const amountPerPhase = roundToTwo(contractValue / numPhases);
  const percentagePerPhase = roundToTwo(100 / numPhases);

  let cumulativeAmount = cumulativeAmountPaid;
  const milestones: MilestonePayment[] = [];

  phases.forEach((phaseName, index) => {
    // Adjust last phase for rounding
    const isLastPhase = index === numPhases - 1;
    const previousTotal = amountPerPhase * index;
    const phaseAmount = isLastPhase 
      ? roundToTwo(contractValue - previousTotal)
      : amountPerPhase;

    // Check TDS applicability for this milestone
    // IMPORTANT: If client is NOT a TDS deductor, TDS never applies
    const { tdsApplicable } = checkTDSApplicability(
      phaseAmount,
      cumulativeAmount,
      undefined,
      clientIsTDSDeductor
    );

    // Calculate TDS for this milestone
    const tds = tdsApplicable 
      ? roundToTwo(phaseAmount * (TAX_RATES.TDS / 100))
      : 0;

    // Calculate TCS for this milestone (always applies)
    const tcs = roundToTwo(phaseAmount * (TAX_RATES.TCS / 100));

    // Calculate GST on service for this milestone
    const serviceGST = freelancerGSTRegistered 
      ? roundToTwo(phaseAmount * (TAX_RATES.GST / 100))
      : null;

    // Calculate platform fee for this milestone
    const platformFee = roundToTwo(phaseAmount * (PLATFORM_FEES.FREELANCER_PERCENTAGE / 100));
    const platformFeeGST = roundToTwo(platformFee * (TAX_RATES.GST / 100));

    // Calculate gross amount for this milestone
    const grossAmount = serviceGST 
      ? roundToTwo(phaseAmount + serviceGST)
      : phaseAmount;

    // Calculate net payout for this milestone
    let netPayout = grossAmount - platformFee - platformFeeGST - tcs;
    if (tdsApplicable) {
      netPayout -= tds;
    }
    netPayout = roundToTwo(netPayout);

    // Update cumulative amount
    cumulativeAmount = roundToTwo(cumulativeAmount + phaseAmount);

    milestones.push({
      phaseIndex: index,
      phaseName,
      amount: phaseAmount,
      percentage: percentagePerPhase,
      tdsApplicable,
      tds,
      tcs,
      serviceGST,
      platformFee,
      platformFeeGST,
      netPayout,
      cumulativeAmount,
      status: 'pending',
    });
  });

  return milestones;
}

// ============================================
// TDS THRESHOLD CHECK
// ============================================

/**
 * Check if TDS is applicable based on threshold rules
 * TDS applies ONLY if:
 * 1. Client is a TDS deductor (has TDS) AND
 * 2. Either:
 *    - Single payment > ₹30,000 OR
 *    - Cumulative payments in FY > ₹30,000
 * 
 * @param currentAmount - Current payment amount
 * @param cumulativeAmount - Previous cumulative amount (same client-freelancer pair in FY)
 * @param forceApplicable - Override for testing
 * @param clientIsTDSDeductor - Whether the client is a TDS deductor
 * @returns TDS applicability and reason
 */
export function checkTDSApplicability(
  currentAmount: number,
  cumulativeAmount: number = 0,
  forceApplicable?: boolean,
  clientIsTDSDeductor: boolean = true
): { tdsApplicable: boolean; tdsReason: TDSReason } {
  // FIRST CHECK: If client is NOT a TDS deductor, TDS NEVER applies
  if (!clientIsTDSDeductor) {
    return {
      tdsApplicable: false,
      tdsReason: 'client_not_tds_deductor',
    };
  }

  // If force override is provided, use it
  if (forceApplicable !== undefined) {
    return {
      tdsApplicable: forceApplicable,
      tdsReason: forceApplicable ? 'single_payment_exceeds_threshold' : 'below_threshold',
    };
  }

  // Check single payment threshold
  if (currentAmount > TDS_THRESHOLD.SINGLE_PAYMENT) {
    return {
      tdsApplicable: true,
      tdsReason: 'single_payment_exceeds_threshold',
    };
  }

  // Check cumulative threshold
  const newCumulative = cumulativeAmount + currentAmount;
  if (newCumulative > TDS_THRESHOLD.CUMULATIVE_PER_FY) {
    return {
      tdsApplicable: true,
      tdsReason: 'cumulative_exceeds_threshold',
    };
  }

  return {
    tdsApplicable: false,
    tdsReason: 'below_threshold',
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Round to 2 decimal places
 */
export function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency in Indian Rupee format
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number in Indian number system (with lakhs/crores)
 */
export function formatIndianNumber(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate percentage
 */
export function calculatePercentage(amount: number, percentage: number): number {
  return roundToTwo(amount * (percentage / 100));
}

// ============================================
// MOCK DATA FOR TESTING
// ============================================

/**
 * Mock function to simulate TDS threshold check
 * In production, this would query the database
 * 
 * @param clientId - Client's user ID
 * @param freelancerId - Freelancer's user ID
 * @param financialYear - Financial year string (e.g., "2025-2026")
 * @returns Mock cumulative amount
 */
export function getMockCumulativeAmount(
  _clientId: string,
  _freelancerId: string,
  _financialYear: string
): number {
  // For testing, return a value that helps test different scenarios
  // Change this value to test threshold crossing
  return 0; // Below threshold - TDS won't apply unless single payment > 30K
  // return 25000; // Near threshold - TDS will apply if payment > 5K
  // return 35000; // Above threshold - TDS will always apply
}

/**
 * Test calculation with sample data
 * Use this to verify calculations are correct
 */
export function runTestCalculation() {
  console.log('=== FREELANCER PAYOUT TEST (₹50,000 contract, GST registered) ===');
  const freelancerPayout = calculateFreelancerPayout({
    contractValue: 50000,
    freelancerGSTRegistered: true,
    forceTDSApplicable: true, // Force TDS for testing
  });
  console.log('Contract Value:', formatINR(freelancerPayout.contractValue));
  console.log('Service GST (18%):', freelancerPayout.serviceGST ? formatINR(freelancerPayout.serviceGST) : 'N/A');
  console.log('Gross Amount:', formatINR(freelancerPayout.grossAmount));
  console.log('Platform Fee (5%):', formatINR(freelancerPayout.platformFee));
  console.log('GST on Platform Fee:', formatINR(freelancerPayout.platformFeeGST));
  console.log('TCS (1%):', formatINR(freelancerPayout.tcs));
  console.log('TDS (10%):', freelancerPayout.tds ? formatINR(freelancerPayout.tds) : 'N/A');
  console.log('TDS Applicable:', freelancerPayout.tdsApplicable);
  console.log('NET PAYOUT:', formatINR(freelancerPayout.netPayout));

  console.log('\n=== CLIENT PAYABLE TEST (₹50,000 contract, GST registered) ===');
  const clientPayable = calculateClientPayable({
    contractValue: 50000,
    freelancerGSTRegistered: true,
    forceTDSApplicable: true,
  });
  console.log('Service Value:', formatINR(clientPayable.serviceValue));
  console.log('Service GST (18%):', clientPayable.serviceGST ? formatINR(clientPayable.serviceGST) : 'N/A');
  console.log('Total Service Amount:', formatINR(clientPayable.totalServiceAmount));
  console.log('Platform Fee (3%):', formatINR(clientPayable.platformFee));
  console.log('GST on Platform Fee:', formatINR(clientPayable.platformFeeGST));
  console.log('TDS Held:', clientPayable.tdsHeld ? formatINR(clientPayable.tdsHeld) : 'N/A');
  console.log('TOTAL PAYABLE:', formatINR(clientPayable.totalPayable));

  return { freelancerPayout, clientPayable };
}
