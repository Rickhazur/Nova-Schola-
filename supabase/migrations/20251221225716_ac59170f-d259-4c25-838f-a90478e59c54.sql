-- Create remedial_program_weeks table (schedule for each week of a student's program)
CREATE TABLE public.remedial_program_weeks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_program_id UUID NOT NULL REFERENCES public.student_remedial_programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  topic TEXT NOT NULL,
  objectives TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_program_id, week_number)
);

-- Create remedial_sessions table (tracks each tutoring session within a program)
CREATE TABLE public.remedial_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_program_id UUID NOT NULL REFERENCES public.student_remedial_programs(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  session_number INTEGER NOT NULL DEFAULT 1,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homework_tasks table (tasks assigned at end of sessions)
CREATE TABLE public.homework_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_program_id UUID NOT NULL REFERENCES public.student_remedial_programs(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  week_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'approved', 'redo_required')),
  last_score INTEGER CHECK (last_score >= 0 AND last_score <= 100),
  feedback TEXT,
  session_id UUID REFERENCES public.remedial_sessions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repository_items table (for file/image uploads - evidence repository)
CREATE TABLE public.repository_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  subject TEXT,
  week_label TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create homework_submissions table (links homework tasks to repository uploads)
CREATE TABLE public.homework_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  homework_task_id UUID NOT NULL REFERENCES public.homework_tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  repository_item_id UUID REFERENCES public.repository_items(id),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.remedial_program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remedial_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repository_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for remedial_program_weeks
CREATE POLICY "Admins can do everything on remedial_program_weeks"
  ON public.remedial_program_weeks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own program weeks"
  ON public.remedial_program_weeks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_remedial_programs srp
      WHERE srp.id = student_program_id AND srp.student_id = auth.uid()
    )
  );

-- RLS Policies for remedial_sessions
CREATE POLICY "Admins can do everything on remedial_sessions"
  ON public.remedial_sessions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own sessions"
  ON public.remedial_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_remedial_programs srp
      WHERE srp.id = student_program_id AND srp.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own sessions"
  ON public.remedial_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_remedial_programs srp
      WHERE srp.id = student_program_id AND srp.student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update their own sessions"
  ON public.remedial_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.student_remedial_programs srp
      WHERE srp.id = student_program_id AND srp.student_id = auth.uid()
    )
  );

-- RLS Policies for homework_tasks
CREATE POLICY "Admins can do everything on homework_tasks"
  ON public.homework_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own homework tasks"
  ON public.homework_tasks FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can update their own homework tasks"
  ON public.homework_tasks FOR UPDATE
  USING (student_id = auth.uid());

-- RLS Policies for repository_items
CREATE POLICY "Admins can do everything on repository_items"
  ON public.repository_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own repository items"
  ON public.repository_items FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own repository items"
  ON public.repository_items FOR INSERT
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can delete their own repository items"
  ON public.repository_items FOR DELETE
  USING (student_id = auth.uid());

-- RLS Policies for homework_submissions
CREATE POLICY "Admins can do everything on homework_submissions"
  ON public.homework_submissions FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Students can view their own submissions"
  ON public.homework_submissions FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Students can insert their own submissions"
  ON public.homework_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());

-- Add updated_at triggers
CREATE TRIGGER update_remedial_program_weeks_updated_at
  BEFORE UPDATE ON public.remedial_program_weeks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remedial_sessions_updated_at
  BEFORE UPDATE ON public.remedial_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_homework_tasks_updated_at
  BEFORE UPDATE ON public.homework_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add weekly_plan column to student_remedial_programs if not exists
ALTER TABLE public.student_remedial_programs 
  ADD COLUMN IF NOT EXISTS generated_plan JSONB,
  ADD COLUMN IF NOT EXISTS current_week INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS subject TEXT;