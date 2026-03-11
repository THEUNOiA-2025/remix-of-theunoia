import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminRole = () => {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin role:', error);
          if (error.message?.includes('JWT expired') || error.code === 'PGRST303') {
            await signOut();
          }
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err: any) {
        console.error('Error checking admin role:', err);
        if (err.message?.includes('JWT expired') || err.code === 'PGRST303') {
          await signOut();
        }
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, signOut]);

  return { isAdmin, loading };
};
