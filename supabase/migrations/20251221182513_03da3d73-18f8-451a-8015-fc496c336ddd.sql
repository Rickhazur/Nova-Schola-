-- Create tutor sessions table
CREATE TABLE public.tutor_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  student_name TEXT,
  age_group TEXT NOT NULL CHECK (age_group IN ('PRIMARY', 'HIGHSCHOOL')),
  timestamp_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  timestamp_end TIMESTAMP WITH TIME ZONE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  status_timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  skill TEXT,
  overall_status TEXT CHECK (overall_status IN ('UNDERSTOOD', 'PARTIAL', 'CONFUSED')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_tutor_sessions_student_id ON public.tutor_sessions(student_id);
CREATE INDEX idx_tutor_sessions_is_active ON public.tutor_sessions(is_active);
CREATE INDEX idx_tutor_sessions_timestamp_start ON public.tutor_sessions(timestamp_start DESC);

-- Enable Row Level Security
ALTER TABLE public.tutor_sessions ENABLE ROW LEVEL SECURITY;

-- For now, allow public access since we don't have auth yet
-- This should be updated when auth is implemented
CREATE POLICY "Allow public read access to sessions" 
ON public.tutor_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert to sessions" 
ON public.tutor_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update to sessions" 
ON public.tutor_sessions 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tutor_sessions_updated_at
BEFORE UPDATE ON public.tutor_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();