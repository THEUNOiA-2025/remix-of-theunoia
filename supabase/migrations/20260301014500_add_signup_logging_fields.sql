-- Add new fields to user_profiles for signup logging and conditional consents
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS consent_version TEXT,
ADD COLUMN IF NOT EXISTS tds_consent_accepted BOOLEAN DEFAULT false;

-- Update the handle_new_user_profile trigger function to extract these new logging fields
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    user_id,
    first_name,
    last_name,
    email,
    user_type,
    profile_completed,
    date_of_birth,
    phone,
    pan,
    gst_registered,
    gstin,
    gst_state,
    bank_account_name,
    bank_account_number,
    bank_ifsc,
    upi_id,
    skills_category,
    portfolio_link,
    education_level,
    college_name,
    declarations_accepted,
    signup_ip,
    signup_device,
    client_type,
    residential_address,
    legal_business_name,
    registered_address,
    will_deduct_tds,
    tan,
    consent_version,
    tds_consent_accepted
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'userType', 'non-student'),
    false,
    CASE WHEN NEW.raw_user_meta_data->>'dob' IS NULL OR NEW.raw_user_meta_data->>'dob' = '' THEN NULL ELSE (NEW.raw_user_meta_data->>'dob')::date END,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'pan',
    COALESCE(NEW.raw_user_meta_data->>'gstRegistered' = 'true', false),
    NEW.raw_user_meta_data->>'gstin',
    NEW.raw_user_meta_data->>'gstState',
    NEW.raw_user_meta_data->>'bankName',
    NEW.raw_user_meta_data->>'bankAccNumber',
    NEW.raw_user_meta_data->>'bankIfsc',
    NEW.raw_user_meta_data->>'upiId',
    NEW.raw_user_meta_data->>'skillsCategory',
    NEW.raw_user_meta_data->>'portfolioLink',
    NEW.raw_user_meta_data->>'educationLevel',
    NEW.raw_user_meta_data->>'collegeName',
    COALESCE(NEW.raw_user_meta_data->>'declarationsAccepted' = 'true', false),
    NEW.raw_user_meta_data->>'signupIp',
    NEW.raw_user_meta_data->>'signupDevice',
    NEW.raw_user_meta_data->>'clientType',
    NEW.raw_user_meta_data->>'residentialAddress',
    NEW.raw_user_meta_data->>'legalBusinessName',
    NEW.raw_user_meta_data->>'registeredAddress',
    COALESCE(NEW.raw_user_meta_data->>'willDeductTds' = 'true', false),
    NEW.raw_user_meta_data->>'tan',
    NEW.raw_user_meta_data->>'consentVersion',
    COALESCE(NEW.raw_user_meta_data->>'tdsConsentAccepted' = 'true', false)
  );
  RETURN NEW;
END;
$$;
