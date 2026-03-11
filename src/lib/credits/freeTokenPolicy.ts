/**
 * Free Token Policy – freelancers only.
 * Backend will grant tokens; this file defines constants and types for frontend.
 * When backend is ready, replace useFreeTokenStatus() implementation with API calls.
 */

/** Token amounts per policy (do not change without product agreement) */
export const FREE_TOKEN_POLICY = {
  /** A. On Sign Up */
  SIGNUP: 100,
  /** B. Profile Completion (student + skill + portfolio + DigiLocker) */
  PROFILE_COMPLETION: 20,
  /** C. First 5 Bids */
  FIRST_5_BIDS: 20,
  /** D. Weekly Free Tokens */
  WEEKLY: 50,
} as const;

export type FreeTokenStatus = {
  /** A. Sign up bonus already granted */
  signupBonus: { granted: boolean; grantedAt?: string | null };
  /** B. Profile completion: all steps done + bonus granted */
  profileCompletion: {
    granted: boolean;
    grantedAt?: string | null;
    /** Steps required: profile complete, student verification, skill verification, portfolio, DigiLocker */
    steps: {
      profileComplete: boolean;
      studentVerification: boolean;
      skillVerification: boolean;
      portfolioUploaded: boolean;
      digilockerVerified: boolean;
    };
  };
  /** C. First 5 bids: count placed, bonus granted when count >= 5 */
  firstFiveBids: {
    granted: boolean;
    grantedAt?: string | null;
    bidsPlaced: number;
  };
  /** D. Weekly: next claim available (ISO date); backend sets after each claim */
  weekly: {
    lastClaimedAt: string | null;
    nextClaimAvailableAt: string | null;
  };
};

/**
 * Token balance for My Bids page.
 * Paid tokens: no expiry. Free tokens: expire 30 days from date of credit.
 * BACKEND: Replace useTokenBalances() / fetch logic with your API when ready.
 */
export type TokenBalances = {
  /** Paid (purchased) tokens – no expiry, stay forever */
  paidBalance: number;
  /** Free tokens (signup, profile completion, etc.) – expire 30 days from date of credit */
  freeBalance: number;
};
