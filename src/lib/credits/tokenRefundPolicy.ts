/**
 * Token Refund Policy – when tokens are refunded vs not.
 * Backend will apply this policy; frontend displays it and (when ready) shows per-bid/project refund status.
 */

/** Human-readable policy copy for UI */
export const TOKEN_REFUND_POLICY = {
  title: 'Token Refund Policy',
  refundedWhen: [
    'Client cancels the project/auction',
  ] as const,
  notRefundedWhen: [
    'Freelancer was not selected',
  ] as const,
} as const;

/**
 * Backend-ready: reason why a bid/project is eligible or not for token refund.
 * When backend is ready, API can return this for a given bid/project.
 */
export type TokenRefundEligibilityReason =
  | { eligible: true; reason: 'client_cancelled_project' }
  | { eligible: false; reason: 'freelancer_not_selected' }
  | { eligible: false; reason: 'other' };

/**
 * Per-bid or per-project refund status (phantom – backend will return when ready).
 */
export type TokenRefundStatus = {
  /** Whether tokens were/are refunded for this bid/project */
  refunded: boolean;
  /** If refunded, when (ISO string) */
  refundedAt?: string | null;
  /** Eligibility reason from policy */
  eligibility: TokenRefundEligibilityReason;
};
