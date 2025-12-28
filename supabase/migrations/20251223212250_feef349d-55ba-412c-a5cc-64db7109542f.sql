-- Add 'guardian' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'guardian';

-- Create guardian_profiles table
CREATE TABLE public.guardian_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Add index for user_id lookups
CREATE INDEX idx_guardian_profiles_user_id ON public.guardian_profiles(user_id);

-- Enable RLS
ALTER TABLE public.guardian_profiles ENABLE ROW LEVEL SECURITY;

-- Add guardian_id column to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS guardian_id uuid REFERENCES public.guardian_profiles(user_id) ON DELETE SET NULL;

-- Create index for guardian_id lookups
CREATE INDEX idx_student_profiles_guardian_id ON public.student_profiles(guardian_id);

-- RLS Policies for guardian_profiles

-- Guardians can view their own profile
CREATE POLICY "Guardians can view their own profile"
ON public.guardian_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Guardians can update their own profile
CREATE POLICY "Guardians can update their own profile"
ON public.guardian_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Guardians can insert their own profile
CREATE POLICY "Guardians can insert their own profile"
ON public.guardian_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can do everything on guardian_profiles
CREATE POLICY "Admins can do everything on guardian_profiles"
ON public.guardian_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update student_profiles RLS: Guardians can view their students
CREATE POLICY "Guardians can view their students"
ON public.student_profiles
FOR SELECT
USING (auth.uid() = guardian_id);

-- Trigger for updated_at on guardian_profiles
CREATE TRIGGER update_guardian_profiles_updated_at
BEFORE UPDATE ON public.guardian_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user function to handle guardian role
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