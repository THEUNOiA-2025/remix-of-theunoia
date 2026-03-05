import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { FreeTokenStatus } from '@/lib/credits/freeTokenPolicy';

/**
 * Returns free token policy status for the current user (freelancers only).
 * BACKEND: Replace this implementation with your API when ready.
 * Expected: API returns FreeTokenStatus; frontend only displays and triggers "claim" actions.
 */
export function useFreeTokenStatus() {
  const { user } = useAuth();

  const query = useQuery<FreeTokenStatus>({
    queryKey: ['free-token-status', user?.id],
    queryFn: (): Promise<FreeTokenStatus> => fetchFreeTokenStatus(user!.id),
    enabled: !!user?.id,
  });

  return query;
}

async function fetchFreeTokenStatus(userId: string): Promise<FreeTokenStatus> {
  // TODO: Replace with backend API when ready, e.g.:
  // const { data, error } = await supabase.rpc('get_freelancer_free_token_status', { p_user_id: userId });
  // if (error) throw error;
  // return data as FreeTokenStatus;

  const profileRes = await supabase.from('user_profiles').select('first_name, last_name').eq('user_id', userId).maybeSingle();
  console.log("User ID:", userId);
  console.log("Data:", profileRes.data);
  console.log("Error:", profileRes.error);

  const verificationRes = await supabase.from('student_verifications').select('verification_status').eq('user_id', userId).maybeSingle();
  console.log("User ID:", userId);
  console.log("Data:", verificationRes.data);
  console.log("Error:", verificationRes.error);
  // @ts-expect-error Supabase generated types cause "excessively deep" instantiation here; safe at runtime
  const bidsRaw = await supabase.from('bids').select('id', { count: 'exact', head: true }).eq('user_id', userId);
  const bidsPlaced = typeof (bidsRaw as { count?: number }).count === 'number' ? (bidsRaw as { count: number }).count : 0;

  const profileComplete = !!(profileRes.data?.first_name && profileRes.data?.last_name);
  const studentVerified = verificationRes.data?.verification_status === 'approved';

  return {
    signupBonus: { granted: true, grantedAt: null },
    profileCompletion: {
      granted: false,
      grantedAt: null,
      steps: {
        profileComplete,
        studentVerification: studentVerified,
        skillVerification: false,
        portfolioUploaded: false,
        digilockerVerified: false,
      },
    },
    firstFiveBids: {
      granted: bidsPlaced >= 5,
      grantedAt: null,
      bidsPlaced,
    },
    weekly: {
      lastClaimedAt: null,
      nextClaimAvailableAt: null,
    },
  };
}

function getMockStatus(): FreeTokenStatus {
  return {
    signupBonus: { granted: false, grantedAt: null },
    profileCompletion: {
      granted: false,
      grantedAt: null,
      steps: {
        profileComplete: false,
        studentVerification: false,
        skillVerification: false,
        portfolioUploaded: false,
        digilockerVerified: false,
      },
    },
    firstFiveBids: { granted: false, grantedAt: null, bidsPlaced: 0 },
    weekly: { lastClaimedAt: null, nextClaimAvailableAt: null },
  };
}
