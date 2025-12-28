-- Create tutor_steps table for storing step definitions
CREATE TABLE IF NOT EXISTS public.tutor_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  step_index INTEGER NOT NULL,
  tutor_text TEXT NOT NULL,
  tutor_drawing_commands JSONB DEFAULT '[]'::jsonb,
  validation_spec JSONB DEFAULT '{}'::jsonb,
  hint_sequence JSONB DEFAULT '[]'::jsonb,
  time_limit_sec INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(session_id, step_id)
);

-- Create student_attempts table for storing validation attempts
CREATE TABLE IF NOT EXISTS public.student_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id UUID REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  student_commands JSONB,
  snapshot_url TEXT,
  score NUMERIC(4,3) CHECK (score >= 0 AND score <= 1),
  passed BOOLEAN DEFAULT false,
  feedback TEXT,
  failed_checks JSONB DEFAULT '[]'::jsonb,
  elapsed_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tutor_steps_session ON public.tutor_steps(session_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_session ON public.student_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_user ON public.student_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_student_attempts_step ON public.student_attempts(session_id, step_id);

-- Enable RLS
ALTER TABLE public.tutor_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_attempts ENABLE ROW LEVEL SECURITY;

-- RLS policies for tutor_steps (read-only for public, managed by backend)
CREATE POLICY "Public can read tutor steps"
  ON public.tutor_steps FOR SELECT
  USING (true);

CREATE POLICY "Backend can insert tutor steps"
  ON public.tutor_steps FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage tutor steps"
  ON public.tutor_steps FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for student_attempts
CREATE POLICY "Public can insert attempts"
  ON public.student_attempts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can read attempts"
  ON public.student_attempts FOR SELECT
  USING (true);

CREATE POLICY "Public can update attempts"
  ON public.student_attempts FOR UPDATE
  USING (true);

CREATE POLICY "Admins can manage attempts"
  ON public.student_attempts FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));