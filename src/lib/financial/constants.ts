/**
 * Financial Constants for THEUNOiA Platform
 * All tax rates, thresholds, and platform fees defined here
 */

// Platform Commission Rates (configurable in future)
export const PLATFORM_FEES = {
  /** Platform fee charged to client (percentage of contract value) */
  CLIENT_PERCENTAGE: 3,
  /** Platform fee charged to freelancer (percentage of contract value) */
  FREELANCER_PERCENTAGE: 5,
} as const;

// Tax Rates
export const TAX_RATES = {
  /** GST rate (18%) - Applied on service if freelancer is GST registered */
  GST: 18,
  /** TDS rate (10%) - Section 194J Professional Services */
  TDS: 10,
  /** TCS rate (1%) - Tax Collected at Source */
  TCS: 1,
} as const;

// TDS Threshold (as per Income Tax Act)
export const TDS_THRESHOLD = {
  /** Single payment threshold in INR */
  SINGLE_PAYMENT: 30000,
  /** Cumulative threshold per client-freelancer pair per Financial Year */
  CUMULATIVE_PER_FY: 30000,
} as const;

// FD Maturity Calculation
export const FD_MATURITY = {
  /** Days after quarter end for statutory TDS compliance */
  QUARTER_END_DAYS: 30,
  /** Additional buffer working days */
  BUFFER_WORKING_DAYS: 5,
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  /** PAN Number format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F) */
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  /** GSTIN format: 2 digits, 10 char PAN, 1 digit, Z, 1 alphanumeric */
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
} as const;

// Financial Year Helper
export const getCurrentFinancialYear = (): string => {
  const today = new Date();
  const month = today.getMonth(); // 0-indexed
  const year = today.getFullYear();
  
  // Financial year in India: April to March
  // If current month is Jan-Mar (0-2), FY started previous year
  if (month < 3) {
    return `${year - 1}-${year}`;
  }
  return `${year}-${year + 1}`;
};

// Quarter End Dates for TDS compliance
export const getQuarterEndDate = (date: Date = new Date()): Date => {
  const month = date.getMonth();
  const year = date.getFullYear();
  
  // Q1: Apr-Jun → June 30
  // Q2: Jul-Sep → September 30
  // Q3: Oct-Dec → December 31
  // Q4: Jan-Mar → March 31
  
  if (month >= 3 && month <= 5) {
    return new Date(year, 5, 30); // June 30
  } else if (month >= 6 && month <= 8) {
    return new Date(year, 8, 30); // September 30
  } else if (month >= 9 && month <= 11) {
    return new Date(year, 11, 31); // December 31
  } else {
    return new Date(year, 2, 31); // March 31
  }
};

// Calculate FD Maturity Date
export const calculateFDMaturityDate = (paymentDate: Date = new Date()): Date => {
  const quarterEnd = getQuarterEndDate(paymentDate);
  
  // Add 30 days after quarter end
  const afterQuarter = new Date(quarterEnd);
  afterQuarter.setDate(afterQuarter.getDate() + FD_MATURITY.QUARTER_END_DAYS);
  
  // Add 5 working days buffer
  let workingDaysAdded = 0;
  const maturityDate = new Date(afterQuarter);
  
  while (workingDaysAdded < FD_MATURITY.BUFFER_WORKING_DAYS) {
    maturityDate.setDate(maturityDate.getDate() + 1);
    const dayOfWeek = maturityDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDaysAdded++;
    }
  }
  
  return maturityDate;
};
