import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { GuardianProfile } from '@/types/guardian';

export function useGuardiansList() {
  return useQuery({
    queryKey: ['guardians-list'],
    queryFn: async (): Promise<GuardianProfile[]> => {
      const { data, error } = await supabase
        .from('guardian_profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });
}

export function useAssignGuardian() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, guardianId }: { studentId: string; guardianId: string | null }) => {
      const { error } = await supabase
        .from('student_profiles')
        .update({ guardian_id: guardianId })
        .eq('user_id', studentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      queryClient.invalidateQueries({ queryKey: ['guardian-students'] });
    }
  });
}

export function useAllStudentsWithGuardians(filter: 'all' | 'with' | 'without', search: string) {
  return useQuery({
    queryKey: ['admin-students', filter, search],
    queryFn: async () => {
      let query = supabase
        .from('student_profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (filter === 'with') {
        query = query.not('guardian_id', 'is', null);
      } else if (filter === 'without') {
        query = query.is('guardian_id', null);
      }

      if (search) {
        query = query.or(`full_name.ilike.%${search}%`);
      }

      const { data: students, error } = await query;
      if (error) throw error;

      // Fetch guardian profiles for students that have guardians
      const guardianIds = [...new Set((students || []).filter(s => s.guardian_id).map(s => s.guardian_id))];
      
      let guardiansMap: Record<string, GuardianProfile> = {};
      
      if (guardianIds.length > 0) {
        const { data: guardians } = await supabase
          .from('guardian_profiles')
          .select('*')
          .in('user_id', guardianIds);
        
        guardiansMap = (guardians || []).reduce((acc, g) => {
          acc[g.user_id] = g;
          return acc;
        }, {} as Record<string, GuardianProfile>);
      }

      return (students || []).map(student => ({
        ...student,
        guardian: student.guardian_id ? guardiansMap[student.guardian_id] : null
      }));
    }
  });
}
