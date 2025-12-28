-- Create icfes_results table for storing ICFES simulation results
CREATE TABLE public.icfes_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  score_global INTEGER,
  scores_by_subject JSONB DEFAULT '{}'::jsonb,
  time_spent_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icfes_results ENABLE ROW LEVEL SECURITY;

-- Students can view their own results
CREATE POLICY "Students can view their own icfes results"
ON public.icfes_results
FOR SELECT
USING (auth.uid()::text = student_id::text);

-- Students can insert their own results
CREATE POLICY "Students can insert their own icfes results"
ON public.icfes_results
FOR INSERT
WITH CHECK (auth.uid()::text = student_id::text);

-- Admins can do everything
CREATE POLICY "Admins can do everything on icfes_results"
ON public.icfes_results
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_icfes_results_student_id ON public.icfes_results(student_id);
CREATE INDEX idx_icfes_results_completed_at ON public.icfes_results(completed_at DESC);