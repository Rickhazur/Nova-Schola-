import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CreateStudentData } from '@/types/guardian';
import { useAuth } from '@/hooks/useAuth';

interface CreateStudentResult {
  success: boolean;
  email: string;
  password: string;
  studentId: string;
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateStudentData): Promise<CreateStudentResult> => {
      if (!user?.id) {
        throw new Error('Debes iniciar sesión como acudiente');
      }

      const { data: result, error } = await supabase.functions.invoke('guardian-create-student', {
        body: {
          full_name: data.full_name,
          email: data.email,
          password: data.password,
          level: data.level,
          guardian_id: user.id
        }
      });

      if (error) {
        throw new Error(error.message || 'Error al crear el estudiante');
      }

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al crear el estudiante');
      }

      return {
        success: true,
        email: data.email,
        password: data.password,
        studentId: result.student_id
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guardian-students'] });
    }
  });
}
