-- Add DELETE policy for tutor_sessions table
-- Allow admins to delete any tutor session
CREATE POLICY "Admins can delete tutor sessions" 
ON public.tutor_sessions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));