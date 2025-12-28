-- Update handle_new_user function to include grade_level from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_role app_role;
  user_grade_level integer;
BEGIN
  -- Get role from metadata, default to student
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::app_role,
    'student'
  );
  
  -- Get grade level from metadata (for students)
  user_grade_level := (NEW.raw_user_meta_data->>'grade_level')::integer;
  
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
      billing_cycle_start,
      grade_level
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'es'),
      true,
      NOW() + INTERVAL '3 days',
      false,
      NULL,
      user_grade_level
    );
  END IF;
  
  -- If guardian, create guardian profile
  IF user_role = 'guardian' THEN
    INSERT INTO public.guardian_profiles (
      user_id,
      full_name,
      email,
      phone
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    );
  END IF;
  
  RETURN NEW;
END;
$function$;