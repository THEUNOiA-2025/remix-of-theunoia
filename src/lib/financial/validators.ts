/**
 * Validation Functions for Financial Fields
 * PAN, GSTIN, and other financial input validation
 */

import { VALIDATION_PATTERNS } from './constants';

// ============================================
// PAN VALIDATION
// ============================================

/**
 * Validate PAN Number format
 * Format: XXXXX0000X (5 letters, 4 digits, 1 letter)
 * 
 * @param pan - PAN number string
 * @returns Validation result
 * 
 * @example
 * validatePAN('ABCDE1234F') // { valid: true }
 * validatePAN('ABC1234F')   // { valid: false, error: '...' }
 */
export function validatePAN(pan: string): { valid: boolean; error?: string } {
  if (!pan || pan.trim() === '') {
    return { valid: false, error: 'PAN number is required' };
  }

  const cleanPAN = pan.trim().toUpperCase();

  if (cleanPAN.length !== 10) {
    return { valid: false, error: 'PAN must be exactly 10 characters' };
  }

  if (!VALIDATION_PATTERNS.PAN.test(cleanPAN)) {
    return {
      valid: false,
      error: 'Invalid PAN format. Must be 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)'
    };
  }

  // Additional validation: 4th character indicates holder type
  const holderType = cleanPAN.charAt(3);
  const validHolderTypes = ['A', 'B', 'C', 'F', 'G', 'H', 'L', 'J', 'P', 'T', 'K'];
  if (!validHolderTypes.includes(holderType)) {
    return {
      valid: false,
      error: 'Invalid PAN holder type character'
    };
  }

  return { valid: true };
}

/**
 * Format PAN number (uppercase and trim)
 */
export function formatPAN(pan: string): string {
  return pan.trim().toUpperCase();
}

/**
 * Get PAN holder type description
 */
export function getPANHolderType(pan: string): string {
  if (!pan || pan.length < 4) return 'Unknown';

  const holderTypes: Record<string, string> = {
    'A': 'Association of Persons (AOP)',
    'B': 'Body of Individuals (BOI)',
    'C': 'Company',
    'F': 'Firm/LLP',
    'G': 'Government',
    'H': 'HUF (Hindu Undivided Family)',
    'L': 'Local Authority',
    'J': 'Artificial Juridical Person',
    'P': 'Individual/Person',
    'T': 'Trust (AOP)',
    'K': 'Krishi Unnat Samaj',
  };

  const type = pan.charAt(3).toUpperCase();
  return holderTypes[type] || 'Unknown';
}

// ============================================
// GSTIN VALIDATION
// ============================================

/**
 * Validate GSTIN format
 * Format: 2 digits (state code) + 10 char PAN + 1 digit (entity number) + Z + 1 alphanumeric (checksum)
 * 
 * @param gstin - GSTIN string
 * @returns Validation result
 * 
 * @example
 * validateGSTIN('27ABCDE1234F1Z5') // { valid: true }
 */
export function validateGSTIN(gstin: string): { valid: boolean; error?: string } {
  if (!gstin || gstin.trim() === '') {
    // GSTIN is optional
    return { valid: true };
  }

  const cleanGSTIN = gstin.trim().toUpperCase();

  if (cleanGSTIN.length !== 15) {
    return { valid: false, error: 'GSTIN must be exactly 15 characters' };
  }

  if (!VALIDATION_PATTERNS.GSTIN.test(cleanGSTIN)) {
    return {
      valid: false,
      error: 'Invalid GSTIN format'
    };
  }

  // Validate state code (01-37, 97)
  const stateCode = parseInt(cleanGSTIN.substring(0, 2), 10);
  const validStateCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 97
  ];

  if (!validStateCodes.includes(stateCode)) {
    return { valid: false, error: 'Invalid state code in GSTIN' };
  }

  // Validate embedded PAN
  const embeddedPAN = cleanGSTIN.substring(2, 12);
  const panValidation = validatePAN(embeddedPAN);
  if (!panValidation.valid) {
    return { valid: false, error: 'Invalid PAN embedded in GSTIN' };
  }

  return { valid: true };
}

/**
 * Format GSTIN (uppercase and trim)
 */
export function formatGSTIN(gstin: string): string {
  return gstin.trim().toUpperCase();
}

/**
 * Extract PAN from GSTIN
 */
export function extractPANFromGSTIN(gstin: string): string | null {
  if (!gstin || gstin.length < 12) return null;
  return gstin.substring(2, 12).toUpperCase();
}

/**
 * Get state name from GSTIN state code
 */
export function getStateFromGSTIN(gstin: string): string {
  if (!gstin || gstin.length < 2) return 'Unknown';

  const stateCodes: Record<string, string> = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman & Diu',
    '26': 'Dadra & Nagar Haveli',
    '27': 'Maharashtra',
    '28': 'Andhra Pradesh (Old)',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh (New)',
    '97': 'Other Territory',
  };

  const code = gstin.substring(0, 2);
  return stateCodes[code] || 'Unknown';
}

// ============================================
// TAN VALIDATION
// ============================================

/**
 * Validate TAN Number format
 * Format: 4 letters, 5 digits, 1 letter (e.g., DELM12345L)
 */
export function validateTAN(tan: string): { valid: boolean; error?: string } {
  if (!tan || tan.trim() === '') {
    return { valid: false, error: 'TAN number is required' };
  }

  const cleanTAN = tan.trim().toUpperCase();

  if (cleanTAN.length !== 10) {
    return { valid: false, error: 'TAN must be exactly 10 characters' };
  }

  const tanRegex = /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/;
  if (!tanRegex.test(cleanTAN)) {
    return {
      valid: false,
      error: 'Invalid TAN format. Must be 4 letters, 5 digits, 1 letter'
    };
  }

  return { valid: true };
}

// ============================================
// COMBINED VALIDATION
// ============================================

/**
 * Validate financial profile fields
 */
export function validateFinancialProfile(
  panNumber: string | null,
  gstinNumber: string | null,
  isGSTRegistered: boolean
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // PAN is mandatory
  if (panNumber) {
    const panResult = validatePAN(panNumber);
    if (!panResult.valid && panResult.error) {
      errors.panNumber = panResult.error;
    }
  } else {
    errors.panNumber = 'PAN number is required';
  }

  // GSTIN is required only if GST registered
  if (isGSTRegistered) {
    if (!gstinNumber) {
      errors.gstinNumber = 'GSTIN is required for GST registered users';
    } else {
      const gstinResult = validateGSTIN(gstinNumber);
      if (!gstinResult.valid && gstinResult.error) {
        errors.gstinNumber = gstinResult.error;
      }
    }
  } else if (gstinNumber) {
    // If not GST registered but GSTIN provided, validate format
    const gstinResult = validateGSTIN(gstinNumber);
    if (!gstinResult.valid && gstinResult.error) {
      errors.gstinNumber = gstinResult.error;
    }
  }

  // Cross-validate: PAN in GSTIN should match provided PAN
  if (panNumber && gstinNumber && gstinNumber.length >= 12) {
    const embeddedPAN = extractPANFromGSTIN(gstinNumber);
    if (embeddedPAN && embeddedPAN !== formatPAN(panNumber)) {
      errors.gstinNumber = 'PAN in GSTIN does not match provided PAN number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

// ============================================
// AMOUNT VALIDATION
// ============================================

/**
 * Validate bid amount
 */
export function validateBidAmount(
  amount: number,
  projectBudget: number | null,
  minPercentage: number = 80
): { valid: boolean; error?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, error: 'Please enter a valid bid amount' };
  }

  if (projectBudget && projectBudget > 0) {
    const minBid = projectBudget * (minPercentage / 100);
    if (amount < minBid) {
      return {
        valid: false,
        error: `Minimum bid is ₹${minBid.toLocaleString('en-IN')} (${minPercentage}% of project budget)`
      };
    }
  }

  return { valid: true };
}
