import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { TokenRefundStatus } from '@/lib/credits/tokenRefundPolicy';

/**
 * Per-bid token refund status (phantom – backend will implement).
 * When backend is ready: call e.g. supabase.rpc('get_bid_token_refund_status', { _bid_id: bidId })
 * and return TokenRefundStatus. Use in My Bids to show "Refunded" / "Not eligible" per row.
 */
export function useTokenRefundStatus(bidId: string | null) {
  const { user } = useAuth();

  const query = useQuery<TokenRefundStatus | null>({
    queryKey: ['token-refund-status', user?.id, bidId],
    queryFn: async (): Promise<TokenRefundStatus | null> => {
      if (!user?.id || !bidId) return null;

      // TODO BACKEND: Replace with your API, e.g.:
      // const { data, error } = await supabase.rpc('get_bid_token_refund_status', { _bid_id: bidId });
      // if (error) throw error;
      // return data as TokenRefundStatus;

      return null;
    },
    enabled: !!user?.id && !!bidId,
  });

  return query;
}
