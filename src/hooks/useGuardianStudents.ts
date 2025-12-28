import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { StudentWithGuardian } from '@/types/guardian';

export function useGuardianStudents() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['guardian-students', user?.id],
    queryFn: async (): Promise<StudentWithGuardian[]> => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('guardian_id', user.id)
        .order('full_name', { ascending: true });

      if (error) throw error;
      
      return (data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        grade_level: profile.grade_level,
        guardian_id: profile.guardian_id,
        plan: profile.plan,
        tokens_used_this_month: profile.tokens_used_this_month,
        token_allowance: profile.token_allowance,
        onboarding_completed: profile.onboarding_completed,
        created_at: profile.created_at
      }));
    },
    enabled: !!user?.id
  });
}
