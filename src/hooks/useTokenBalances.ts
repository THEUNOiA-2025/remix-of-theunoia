import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { TokenBalances } from '@/lib/credits/freeTokenPolicy';
import { FREE_TOKEN_POLICY } from '@/lib/credits/freeTokenPolicy';

/** Transaction types that grant *free* tokens (signup, profile, etc.). */
const FREE_CREDIT_TRANSACTION_TYPES = ['signup_bonus'] as const;

/**
 * Returns paid and free token balances for the current freelancer.
 * Paid: no expiry. Free: expire 30 days from date of credit.
 * Signup free is capped at FREE_TOKEN_POLICY.SIGNUP (100). Rest of total = paid.
 */
export function useTokenBalances() {
  const { user } = useAuth();

  const query = useQuery<TokenBalances>({
    queryKey: ['token-balances', user?.id],
    queryFn: async (): Promise<TokenBalances> => {
      if (!user?.id) return { paidBalance: 0, freeBalance: 0 };

      // 1) Total balance from backend (single source of truth)
      const { data: totalData, error: balanceError } = await supabase.rpc('get_freelancer_credit_balance', {
        _user_id: user.id,
      });
      if (balanceError) throw balanceError;
      const total = typeof totalData === 'number' ? totalData : 0;

      // 2) Free tokens from signup only: cap at policy (100) to avoid duplicate/legacy 50s over-counting
      const { data: txList, error: txError } = await supabase
        .from('credit_transactions')
        .select('amount, transaction_type')
        .eq('user_id', user.id)
        .in('transaction_type', [...FREE_CREDIT_TRANSACTION_TYPES]);
      if (txError) throw txError;
      const signupBonusSum = (txList ?? []).reduce((sum, tx) => sum + Math.max(0, tx.amount), 0);
      const freeFromSignup = Math.min(signupBonusSum, FREE_TOKEN_POLICY.SIGNUP);

      // Free = min(total, free from signup). Paid = total - free. (Free consumed first when bidding.)
      const freeBalance = Math.min(total, freeFromSignup);
      const paidBalance = total - freeBalance;

      return { paidBalance, freeBalance };
    },
    enabled: !!user?.id,
  });

  return query;
}
