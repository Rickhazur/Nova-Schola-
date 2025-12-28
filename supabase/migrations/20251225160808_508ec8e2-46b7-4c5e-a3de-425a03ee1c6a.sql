-- Create tutor_drawings table for persisting AI-generated drawing commands
CREATE TABLE IF NOT EXISTS public.tutor_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.tutor_sessions(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  commands jsonb NOT NULL DEFAULT '[]'::jsonb,
  thumbnail_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_tutor_drawings_session ON public.tutor_drawings(session_id);
CREATE INDEX idx_tutor_drawings_message ON public.tutor_drawings(message_id);

-- Enable RLS
ALTER TABLE public.tutor_drawings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Public can read drawings"
  ON public.tutor_drawings
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert drawings"
  ON public.tutor_drawings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage drawings"
  ON public.tutor_drawings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add comment for documentation
COMMENT ON TABLE public.tutor_drawings IS 'Stores AI-generated drawing commands for the whiteboard layer';