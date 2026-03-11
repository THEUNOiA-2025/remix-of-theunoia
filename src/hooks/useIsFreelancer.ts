import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

/** Credits are for freelancers only. Clients should not see credit routes. */
export function useIsFreelancer() {
  const { user } = useAuth();

  const { data: userType, isLoading } = useQuery({
    queryKey: ['user-type', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('user_id', user.id)
        .single();

      console.log("User ID:", user?.id);
      console.log("Data:", data);
      console.log("Error:", error);

      if (error) throw error;
      return data?.user_type as string | null;
    },
    enabled: !!user?.id,
  });

  const isClient = userType === 'non-student';
  const isFreelancer = !!user?.id && !isClient;

  return { isFreelancer, isClient, isLoading: isLoading || !user };
}
