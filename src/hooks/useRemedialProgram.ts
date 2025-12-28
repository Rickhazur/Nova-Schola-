import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RemedialProgram {
  id: string;
  student_id: string;
  program_id: string | null;
  custom_title: string | null;
  subject: string | null;
  goals: string | null;
  status: string;
  current_week: number | null;
  start_date: string;
  end_date: string | null;
  generated_plan: any;
  remedial_programs?: {
    name: string;
    subject: string;
  } | null;
}

interface ProgramWeek {
  id: string;
  week_number: number;
  topic: string;
  objectives: string | null;
  status: string;
}

interface HomeworkTask {
  id: string;
  week_number: number;
  description: string;
  due_date: string | null;
  status: string;
  last_score: number | null;
  feedback: string | null;
}

interface RemedialProgramState {
  activeProgram: RemedialProgram | null;
  currentWeek: ProgramWeek | null;
  pendingHomework: HomeworkTask | null;
  isBlocked: boolean;
  blockReason: string | null;
  isLoading: boolean;
  programCompleted: boolean;
}

export function useRemedialProgram(studentId: string | null) {
  const [state, setState] = useState<RemedialProgramState>({
    activeProgram: null,
    currentWeek: null,
    pendingHomework: null,
    isBlocked: false,
    blockReason: null,
    isLoading: true,
    programCompleted: false,
  });

  const fetchProgramData = useCallback(async () => {
    if (!studentId) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      // Fetch active remedial program
      const { data: programs, error: programError } = await supabase
        .from('student_remedial_programs')
        .select(`
          *,
          remedial_programs (name, subject)
        `)
        .eq('student_id', studentId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      if (programError) {
        console.error('Error fetching remedial program:', programError);
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      const activeProgram = (programs && programs.length > 0) ? programs[0] as unknown as RemedialProgram : null;

      if (!activeProgram) {
        setState({
          activeProgram: null,
          currentWeek: null,
          pendingHomework: null,
          isBlocked: false,
          blockReason: null,
          isLoading: false,
          programCompleted: false,
        });
        return;
      }

      // Check if plan was generated (has weeks)
      const { data: weeks } = await supabase
        .from('remedial_program_weeks')
        .select('*')
        .eq('student_program_id', activeProgram.id)
        .order('week_number');

      // If no weeks, generate the plan
      if (!weeks || weeks.length === 0) {
        console.log('No weeks found, generating plan...');
        try {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-remedial-plan`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentProgramId: activeProgram.id }),
            }
          );
          
          if (response.ok) {
            // Refetch after plan generation
            setTimeout(() => fetchProgramData(), 1000);
            return;
          }
        } catch (err) {
          console.error('Error generating plan:', err);
        }
      }

      // Get current week
      const currentWeekNumber = activeProgram.current_week || 1;
      const currentWeek = weeks?.find((w: any) => w.week_number === currentWeekNumber) || 
                         weeks?.find((w: any) => w.status !== 'completed') ||
                         (weeks && weeks[0]) || null;

      // Check for pending homework
      const { data: homeworkTasks } = await supabase
        .from('homework_tasks')
        .select('*')
        .eq('student_program_id', activeProgram.id)
        .in('status', ['pending', 'redo_required'])
        .order('created_at', { ascending: false })
        .limit(1);

      const pendingHomework = (homeworkTasks && homeworkTasks.length > 0) ? homeworkTasks[0] : null;

      // Check if blocked (has pending homework without submission)
      let isBlocked = false;
      let blockReason: string | null = null;

      if (pendingHomework) {
        // Check if there's a submission for this homework
        const { data: submissions } = await supabase
          .from('homework_submissions')
          .select('id')
          .eq('homework_task_id', pendingHomework.id)
          .limit(1);

        if (!submissions || submissions.length === 0) {
          isBlocked = true;
          if (pendingHomework.status === 'redo_required') {
            blockReason = 'Tu tarea anterior necesita correcciones. Por favor, revisa los comentarios y vuelve a subirla.';
          } else {
            blockReason = 'Para continuar con tu programa de refuerzo, primero debes subir la foto de tu tarea al repositorio.';
          }
        }
      }

      setState({
        activeProgram,
        currentWeek: currentWeek as ProgramWeek | null,
        pendingHomework,
        isBlocked,
        blockReason,
        isLoading: false,
        programCompleted: false,
      });

    } catch (error) {
      console.error('Error in useRemedialProgram:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [studentId]);

  useEffect(() => {
    fetchProgramData();
  }, [fetchProgramData]);

  const refreshProgram = useCallback(() => {
    fetchProgramData();
  }, [fetchProgramData]);

  const endSessionAndAssignHomework = useCallback(async (sessionSummary?: string) => {
    if (!state.activeProgram || !state.currentWeek) return null;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/assign-homework`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentProgramId: state.activeProgram.id,
            weekNumber: state.currentWeek.week_number,
            sessionSummary,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to assign homework');
      }

      const data = await response.json();
      await fetchProgramData();
      return data.task;
    } catch (error) {
      console.error('Error assigning homework:', error);
      return null;
    }
  }, [state.activeProgram, state.currentWeek, fetchProgramData]);

  const submitHomework = useCallback(async (repositoryItemId: string) => {
    if (!state.pendingHomework || !studentId) return false;

    try {
      // Create homework submission
      const { error } = await supabase
        .from('homework_submissions')
        .insert({
          homework_task_id: state.pendingHomework.id,
          student_id: studentId,
          repository_item_id: repositoryItemId,
        });

      if (error) throw error;

      // Update homework task status
      await supabase
        .from('homework_tasks')
        .update({ status: 'submitted' })
        .eq('id', state.pendingHomework.id);

      await fetchProgramData();
      return true;
    } catch (error) {
      console.error('Error submitting homework:', error);
      return false;
    }
  }, [state.pendingHomework, studentId, fetchProgramData]);

  return {
    ...state,
    refreshProgram,
    endSessionAndAssignHomework,
    submitHomework,
  };
}
