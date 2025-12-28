-- Create leveling plan status enum
CREATE TYPE public.leveling_status AS ENUM ('ACTIVE', 'COMPLETED', 'PENDING');

-- Create leveling_plans table
CREATE TABLE public.leveling_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status leveling_status NOT NULL DEFAULT 'PENDING',
    difficulty_level INTEGER NOT NULL DEFAULT 3 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    goals TEXT,
    recommended_sessions JSONB NOT NULL DEFAULT '[]'::jsonb,
    weekly_plan JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_sessions INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leveling_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for leveling_plans
CREATE POLICY "Users can view their own leveling plans"
ON public.leveling_plans
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own leveling plans"
ON public.leveling_plans
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can update their own leveling plans"
ON public.leveling_plans
FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all leveling plans"
ON public.leveling_plans
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all leveling plans"
ON public.leveling_plans
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert leveling plans for any student"
ON public.leveling_plans
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_leveling_plans_updated_at
BEFORE UPDATE ON public.leveling_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_leveling_plans_student_status ON public.leveling_plans(student_id, status);
CREATE INDEX idx_leveling_plans_subject ON public.leveling_plans(subject);