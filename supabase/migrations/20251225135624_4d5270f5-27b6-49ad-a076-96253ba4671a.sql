-- Add enrolled_by column to track how student was enrolled
-- 'admin' = enrolled by administrator (no old password required for change)
-- 'guardian' = enrolled by parent/guardian (old password required)
-- 'self' = self-registered (old password required)
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS enrolled_by text DEFAULT 'self';

-- Add comment to explain the column
COMMENT ON COLUMN public.student_profiles.enrolled_by IS 'Tracks enrollment method: admin, guardian, or self. Affects password change flow.';