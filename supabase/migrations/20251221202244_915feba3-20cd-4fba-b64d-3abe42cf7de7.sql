-- Create plan type enum
CREATE TYPE public.plan_type AS ENUM ('BASIC', 'PRO', 'ELITE');

-- Add plan fields to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN plan plan_type NOT NULL DEFAULT 'BASIC',
ADD COLUMN token_allowance integer NOT NULL DEFAULT 50,
ADD COLUMN tokens_used_this_month integer NOT NULL DEFAULT 0,
ADD COLUMN token_reset_date date NOT NULL DEFAULT CURRENT_DATE;

-- Create index for plan queries
CREATE INDEX idx_student_profiles_plan ON public.student_profiles(plan);