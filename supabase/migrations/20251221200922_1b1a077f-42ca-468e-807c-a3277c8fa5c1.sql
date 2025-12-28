-- Add guardian_name to student_profiles if not exists
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS guardian_name TEXT;

-- Create guardian_reports table
CREATE TABLE public.guardian_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    summary_text TEXT NOT NULL,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'viewed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guardian_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for guardian_reports
CREATE POLICY "Users can view their own reports"
ON public.guardian_reports
FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Users can insert their own reports"
ON public.guardian_reports
FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins can view all reports"
ON public.guardian_reports
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert reports for any student"
ON public.guardian_reports
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all reports"
ON public.guardian_reports
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX idx_guardian_reports_student ON public.guardian_reports(student_id);
CREATE INDEX idx_guardian_reports_week ON public.guardian_reports(week_start, week_end);