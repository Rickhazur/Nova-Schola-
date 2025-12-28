-- Add trial and payment fields to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS is_trial_active boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS billing_cycle_start date;

-- Update existing students to have trial_ends_at set (3 days from now for new, null for existing paid)
UPDATE public.student_profiles 
SET trial_ends_at = NOW() + INTERVAL '3 days'
WHERE trial_ends_at IS NULL AND is_paid = false;

-- Update the handle_new_user function to set trial fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
BEGIN
  -- Get role from metadata, default to student
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'
  );
  
  -- Insert role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);
  
  -- If student, create profile placeholder with trial fields
  IF user_role = 'student' THEN
    INSERT INTO public.student_profiles (
      user_id, 
      full_name, 
      preferred_language,
      is_trial_active,
      trial_ends_at,
      is_paid,
      billing_cycle_start
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'es'),
      true,
      NOW() + INTERVAL '3 days',
      false,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$function$;