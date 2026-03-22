import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { validatePAN } from "@/lib/financial/validators";

interface FinancialProfileStatus {
  isComplete: boolean;
  isLoading: boolean;
  panNumber: string | null;
  isGSTRegistered: boolean;
  gstinNumber: string | null;
  /** Whether the user is a TDS deductor (only relevant for clients) */
  isTDSDeductor: boolean;
  /** User type (student = freelancer, non-student = client) */
  userType: 'student' | 'non-student' | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to check if the user has completed their financial profile
 * Checks for PAN number (mandatory) and GSTIN (if GST registered)
 */
export function useFinancialProfile(): FinancialProfileStatus {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [panNumber, setPanNumber] = useState<string | null>(null);
  const [isGSTRegistered, setIsGSTRegistered] = useState(false);
  const [gstinNumber, setGstinNumber] = useState<string | null>(null);
  const [isTDSDeductor, setIsTDSDeductor] = useState(false);
  const [userType, setUserType] = useState<'student' | 'non-student' | null>(null);

  const fetchFinancialProfile = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // First check user metadata (stored during signup/profile edit)
      const meta = user.user_metadata as {
        userType?: 'student' | 'non-student';
        panNumber?: string;
        isGSTRegistered?: boolean;
        gstinNumber?: string;
        isTDSDeductor?: boolean;
      } | undefined;

      // Set user type
      if (meta?.userType) setUserType(meta.userType);
      
      // Set TDS deductor status
      if (meta?.isTDSDeductor !== undefined) setIsTDSDeductor(meta.isTDSDeductor);

      if (meta?.panNumber) {
        setPanNumber(meta.panNumber);
        setIsGSTRegistered(meta.isGSTRegistered || false);
        setGstinNumber(meta.gstinNumber || null);
        setIsLoading(false);
        return;
      }

      // Fallback: Check user_profiles table (for when backend is implemented)
      const { data, error } = await supabase
        .from("user_profiles")
        .select("pan_number, is_gst_registered, gstin_number, is_tds_deductor")
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        const row = data as {
          pan_number?: string;
          is_gst_registered?: boolean;
          gstin_number?: string;
          is_tds_deductor?: boolean;
        };
        setPanNumber(row.pan_number || null);
        setIsGSTRegistered(row.is_gst_registered || false);
        setGstinNumber(row.gstin_number || null);
        if (row.is_tds_deductor !== undefined) setIsTDSDeductor(row.is_tds_deductor);
      }
    } catch (error) {
      console.error("Error fetching financial profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFinancialProfile();
  }, [fetchFinancialProfile]);

  // Profile is complete if:
  // 1. PAN number exists and is valid
  // 2. If GST registered, GSTIN must also exist
  const isPanValid = panNumber ? validatePAN(panNumber).valid : false;
  const isGstinRequired = isGSTRegistered;
  const hasRequiredGstin = !isGstinRequired || (gstinNumber && gstinNumber.length === 15);

  const isComplete = isPanValid && hasRequiredGstin;

  return {
    isComplete,
    isLoading,
    panNumber,
    isGSTRegistered,
    gstinNumber,
    isTDSDeductor,
    userType,
    refetch: fetchFinancialProfile,
  };
}

/**
 * Simple check function for one-time use
 * Returns true if user has completed financial profile
 */
export async function checkFinancialProfileComplete(userId: string): Promise<boolean> {
  try {
    // Get user from Supabase auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) return false;

    // Check user metadata first
    const meta = user.user_metadata as {
      panNumber?: string;
      isGSTRegistered?: boolean;
      gstinNumber?: string;
    } | undefined;

    if (meta?.panNumber) {
      const isPanValid = validatePAN(meta.panNumber).valid;
      const isGstinRequired = meta.isGSTRegistered;
      const hasRequiredGstin = !isGstinRequired || (meta.gstinNumber && meta.gstinNumber.length === 15);
      return isPanValid && hasRequiredGstin;
    }

    // Fallback: Check database
    const { data, error } = await supabase
      .from("user_profiles")
      .select("pan_number, is_gst_registered, gstin_number")
      .eq("user_id", userId)
      .single();

    if (error || !data) return false;

    const row = data as {
      pan_number?: string;
      is_gst_registered?: boolean;
      gstin_number?: string;
    };

    if (!row.pan_number) return false;
    
    const isPanValid = validatePAN(row.pan_number).valid;
    const isGstinRequired = row.is_gst_registered;
    const hasRequiredGstin = !isGstinRequired || (row.gstin_number && row.gstin_number.length === 15);
    
    return isPanValid && hasRequiredGstin;
  } catch {
    return false;
  }
}
