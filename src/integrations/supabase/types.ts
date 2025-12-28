export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      coin_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by_admin_id: string | null
          id: string
          reason: string
          student_id: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by_admin_id?: string | null
          id?: string
          reason: string
          student_id: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by_admin_id?: string | null
          id?: string
          reason?: string
          student_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      guardian_profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guardian_reports: {
        Row: {
          created_at: string
          id: string
          status: string | null
          student_id: string
          summary_text: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string | null
          student_id: string
          summary_text: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string | null
          student_id?: string
          summary_text?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      homework_submissions: {
        Row: {
          homework_task_id: string
          id: string
          notes: string | null
          repository_item_id: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          homework_task_id: string
          id?: string
          notes?: string | null
          repository_item_id?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          homework_task_id?: string
          id?: string
          notes?: string | null
          repository_item_id?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_submissions_homework_task_id_fkey"
            columns: ["homework_task_id"]
            isOneToOne: false
            referencedRelation: "homework_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_submissions_repository_item_id_fkey"
            columns: ["repository_item_id"]
            isOneToOne: false
            referencedRelation: "repository_items"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_tasks: {
        Row: {
          created_at: string
          description: string
          due_date: string | null
          feedback: string | null
          id: string
          last_score: number | null
          session_id: string | null
          status: string
          student_id: string
          student_program_id: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          description: string
          due_date?: string | null
          feedback?: string | null
          id?: string
          last_score?: number | null
          session_id?: string | null
          status?: string
          student_id: string
          student_program_id: string
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string | null
          feedback?: string | null
          id?: string
          last_score?: number | null
          session_id?: string | null
          status?: string
          student_id?: string
          student_program_id?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "homework_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "remedial_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tasks_student_program_id_fkey"
            columns: ["student_program_id"]
            isOneToOne: false
            referencedRelation: "student_remedial_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      icfes_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          created_at: string
          id: string
          is_correct: boolean | null
          question_id: string
          respuesta: string | null
          student_id: string
          time_spent_seconds: number | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id: string
          respuesta?: string | null
          student_id: string
          time_spent_seconds?: number | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          created_at?: string
          id?: string
          is_correct?: boolean | null
          question_id?: string
          respuesta?: string | null
          student_id?: string
          time_spent_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "icfes_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "icfes_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "icfes_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "icfes_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      icfes_attempts: {
        Row: {
          areas: string[]
          completed_at: string | null
          created_at: string
          id: string
          mode: string
          score_global: number | null
          scores_by_area: Json | null
          started_at: string
          status: string
          student_id: string
          time_limit_seconds: number | null
          total_questions: number
          updated_at: string
        }
        Insert: {
          areas: string[]
          completed_at?: string | null
          created_at?: string
          id?: string
          mode: string
          score_global?: number | null
          scores_by_area?: Json | null
          started_at?: string
          status?: string
          student_id: string
          time_limit_seconds?: number | null
          total_questions: number
          updated_at?: string
        }
        Update: {
          areas?: string[]
          completed_at?: string | null
          created_at?: string
          id?: string
          mode?: string
          score_global?: number | null
          scores_by_area?: Json | null
          started_at?: string
          status?: string
          student_id?: string
          time_limit_seconds?: number | null
          total_questions?: number
          updated_at?: string
        }
        Relationships: []
      }
      icfes_questions: {
        Row: {
          area: string
          competencia: string | null
          created_at: string
          dificultad: number
          enunciado: string
          explicacion: string | null
          id: string
          imagen_url: string | null
          is_active: boolean
          opcion_a: string
          opcion_b: string
          opcion_c: string
          opcion_d: string
          respuesta_correcta: string
          updated_at: string
        }
        Insert: {
          area: string
          competencia?: string | null
          created_at?: string
          dificultad?: number
          enunciado: string
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          is_active?: boolean
          opcion_a: string
          opcion_b: string
          opcion_c: string
          opcion_d: string
          respuesta_correcta: string
          updated_at?: string
        }
        Update: {
          area?: string
          competencia?: string | null
          created_at?: string
          dificultad?: number
          enunciado?: string
          explicacion?: string | null
          id?: string
          imagen_url?: string | null
          is_active?: boolean
          opcion_a?: string
          opcion_b?: string
          opcion_c?: string
          opcion_d?: string
          respuesta_correcta?: string
          updated_at?: string
        }
        Relationships: []
      }
      icfes_results: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          score_global: number | null
          scores_by_subject: Json | null
          student_id: string
          time_spent_seconds: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          score_global?: number | null
          scores_by_subject?: Json | null
          student_id: string
          time_spent_seconds?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          score_global?: number | null
          scores_by_subject?: Json | null
          student_id?: string
          time_spent_seconds?: number | null
        }
        Relationships: []
      }
      icfes_stats: {
        Row: {
          avg_score_global: number | null
          last_attempt_at: string | null
          score_ciencias: number | null
          score_ingles: number | null
          score_lectura_critica: number | null
          score_matematicas: number | null
          score_sociales: number | null
          strongest_area: string | null
          student_id: string
          total_correct: number
          total_questions_answered: number
          total_time_spent_seconds: number
          updated_at: string
          weakest_area: string | null
        }
        Insert: {
          avg_score_global?: number | null
          last_attempt_at?: string | null
          score_ciencias?: number | null
          score_ingles?: number | null
          score_lectura_critica?: number | null
          score_matematicas?: number | null
          score_sociales?: number | null
          strongest_area?: string | null
          student_id: string
          total_correct?: number
          total_questions_answered?: number
          total_time_spent_seconds?: number
          updated_at?: string
          weakest_area?: string | null
        }
        Update: {
          avg_score_global?: number | null
          last_attempt_at?: string | null
          score_ciencias?: number | null
          score_ingles?: number | null
          score_lectura_critica?: number | null
          score_matematicas?: number | null
          score_sociales?: number | null
          strongest_area?: string | null
          student_id?: string
          total_correct?: number
          total_questions_answered?: number
          total_time_spent_seconds?: number
          updated_at?: string
          weakest_area?: string | null
        }
        Relationships: []
      }
      leveling_plans: {
        Row: {
          completed_sessions: number | null
          created_at: string
          difficulty_level: number
          end_date: string
          goals: string | null
          id: string
          recommended_sessions: Json
          start_date: string
          status: Database["public"]["Enums"]["leveling_status"]
          student_id: string
          subject: string
          topic: string
          total_sessions: number | null
          updated_at: string
          weekly_plan: Json
        }
        Insert: {
          completed_sessions?: number | null
          created_at?: string
          difficulty_level?: number
          end_date: string
          goals?: string | null
          id?: string
          recommended_sessions?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["leveling_status"]
          student_id: string
          subject: string
          topic: string
          total_sessions?: number | null
          updated_at?: string
          weekly_plan?: Json
        }
        Update: {
          completed_sessions?: number | null
          created_at?: string
          difficulty_level?: number
          end_date?: string
          goals?: string | null
          id?: string
          recommended_sessions?: Json
          start_date?: string
          status?: Database["public"]["Enums"]["leveling_status"]
          student_id?: string
          subject?: string
          topic?: string
          total_sessions?: number | null
          updated_at?: string
          weekly_plan?: Json
        }
        Relationships: []
      }
      remedial_program_weeks: {
        Row: {
          created_at: string
          id: string
          objectives: string | null
          status: string
          student_program_id: string
          topic: string
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          objectives?: string | null
          status?: string
          student_program_id: string
          topic: string
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          id?: string
          objectives?: string | null
          status?: string
          student_program_id?: string
          topic?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "remedial_program_weeks_student_program_id_fkey"
            columns: ["student_program_id"]
            isOneToOne: false
            referencedRelation: "student_remedial_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      remedial_programs: {
        Row: {
          created_at: string
          created_by: string
          default_duration_weeks: number
          description: string | null
          id: string
          is_active: boolean
          level: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_duration_weeks?: number
          description?: string | null
          id?: string
          is_active?: boolean
          level: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_duration_weeks?: number
          description?: string | null
          id?: string
          is_active?: boolean
          level?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      remedial_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          notes: string | null
          session_number: number
          started_at: string
          student_program_id: string
          summary: string | null
          updated_at: string
          week_number: number
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          session_number?: number
          started_at?: string
          student_program_id: string
          summary?: string | null
          updated_at?: string
          week_number: number
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          notes?: string | null
          session_number?: number
          started_at?: string
          student_program_id?: string
          summary?: string | null
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "remedial_sessions_student_program_id_fkey"
            columns: ["student_program_id"]
            isOneToOne: false
            referencedRelation: "student_remedial_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      repository_items: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          student_id: string
          subject: string | null
          week_label: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          student_id: string
          subject?: string | null
          week_label?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          student_id?: string
          subject?: string | null
          week_label?: string | null
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          delivered_at: string | null
          delivered_by_admin_id: string | null
          id: string
          reward_id: string
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          delivered_by_admin_id?: string | null
          id?: string
          reward_id: string
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          delivered_by_admin_id?: string | null
          id?: string
          reward_id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      rewards: {
        Row: {
          category: string
          cost_coins: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category: string
          cost_coins: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string
          cost_coins?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_attempts: {
        Row: {
          attempt_number: number
          created_at: string
          elapsed_ms: number | null
          failed_checks: Json | null
          feedback: string | null
          id: string
          passed: boolean | null
          score: number | null
          session_id: string | null
          snapshot_url: string | null
          step_id: string
          student_commands: Json | null
          user_id: string | null
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          elapsed_ms?: number | null
          failed_checks?: Json | null
          feedback?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          session_id?: string | null
          snapshot_url?: string | null
          step_id: string
          student_commands?: Json | null
          user_id?: string | null
        }
        Update: {
          attempt_number?: number
          created_at?: string
          elapsed_ms?: number | null
          failed_checks?: Json | null
          feedback?: string | null
          id?: string
          passed?: boolean | null
          score?: number | null
          session_id?: string | null
          snapshot_url?: string | null
          step_id?: string
          student_commands?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_coins: {
        Row: {
          balance: number
          student_id: string
          total_earned: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          balance?: number
          student_id: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          student_id?: string
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_coins_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "student_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          age: number | null
          billing_cycle_start: string | null
          created_at: string
          enrolled_by: string | null
          full_name: string
          grade_level: number | null
          guardian_id: string | null
          guardian_name: string | null
          guardian_whatsapp: string | null
          id: string
          is_paid: boolean
          is_trial_active: boolean
          onboarding_completed: boolean | null
          plan: Database["public"]["Enums"]["plan_type"]
          preferred_language: string | null
          status: string
          token_allowance: number
          token_reset_date: string
          tokens_used_this_month: number
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          billing_cycle_start?: string | null
          created_at?: string
          enrolled_by?: string | null
          full_name: string
          grade_level?: number | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_whatsapp?: string | null
          id?: string
          is_paid?: boolean
          is_trial_active?: boolean
          onboarding_completed?: boolean | null
          plan?: Database["public"]["Enums"]["plan_type"]
          preferred_language?: string | null
          status?: string
          token_allowance?: number
          token_reset_date?: string
          tokens_used_this_month?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          billing_cycle_start?: string | null
          created_at?: string
          enrolled_by?: string | null
          full_name?: string
          grade_level?: number | null
          guardian_id?: string | null
          guardian_name?: string | null
          guardian_whatsapp?: string | null
          id?: string
          is_paid?: boolean
          is_trial_active?: boolean
          onboarding_completed?: boolean | null
          plan?: Database["public"]["Enums"]["plan_type"]
          preferred_language?: string | null
          status?: string
          token_allowance?: number
          token_reset_date?: string
          tokens_used_this_month?: number
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardian_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      student_remedial_programs: {
        Row: {
          created_at: string
          current_week: number | null
          custom_title: string | null
          end_date: string | null
          generated_plan: Json | null
          goals: string | null
          id: string
          notes: string | null
          program_id: string | null
          start_date: string
          status: string
          student_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_week?: number | null
          custom_title?: string | null
          end_date?: string | null
          generated_plan?: Json | null
          goals?: string | null
          id?: string
          notes?: string | null
          program_id?: string | null
          start_date?: string
          status?: string
          student_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_week?: number | null
          custom_title?: string | null
          end_date?: string | null
          generated_plan?: Json | null
          goals?: string | null
          id?: string
          notes?: string | null
          program_id?: string | null
          start_date?: string
          status?: string
          student_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_remedial_programs_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "remedial_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_remedial_programs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tutor_drawings: {
        Row: {
          commands: Json
          created_at: string
          id: string
          message_id: string
          session_id: string | null
          thumbnail_url: string | null
        }
        Insert: {
          commands?: Json
          created_at?: string
          id?: string
          message_id: string
          session_id?: string | null
          thumbnail_url?: string | null
        }
        Update: {
          commands?: Json
          created_at?: string
          id?: string
          message_id?: string
          session_id?: string | null
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_drawings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_sessions: {
        Row: {
          age_group: string
          created_at: string
          id: string
          is_active: boolean
          messages: Json
          notes: string | null
          overall_status: string | null
          skill: string | null
          status_timeline: Json
          student_id: string
          student_name: string | null
          timestamp_end: string | null
          timestamp_start: string
          updated_at: string
        }
        Insert: {
          age_group: string
          created_at?: string
          id?: string
          is_active?: boolean
          messages?: Json
          notes?: string | null
          overall_status?: string | null
          skill?: string | null
          status_timeline?: Json
          student_id: string
          student_name?: string | null
          timestamp_end?: string | null
          timestamp_start?: string
          updated_at?: string
        }
        Update: {
          age_group?: string
          created_at?: string
          id?: string
          is_active?: boolean
          messages?: Json
          notes?: string | null
          overall_status?: string | null
          skill?: string | null
          status_timeline?: Json
          student_id?: string
          student_name?: string | null
          timestamp_end?: string | null
          timestamp_start?: string
          updated_at?: string
        }
        Relationships: []
      }
      tutor_steps: {
        Row: {
          created_at: string
          hint_sequence: Json | null
          id: string
          session_id: string
          step_id: string
          step_index: number
          time_limit_sec: number | null
          tutor_drawing_commands: Json | null
          tutor_text: string
          validation_spec: Json | null
        }
        Insert: {
          created_at?: string
          hint_sequence?: Json | null
          id?: string
          session_id: string
          step_id: string
          step_index: number
          time_limit_sec?: number | null
          tutor_drawing_commands?: Json | null
          tutor_text: string
          validation_spec?: Json | null
        }
        Update: {
          created_at?: string
          hint_sequence?: Json | null
          id?: string
          session_id?: string
          step_id?: string
          step_index?: number
          time_limit_sec?: number | null
          tutor_drawing_commands?: Json | null
          tutor_text?: string
          validation_spec?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "tutor_steps_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin" | "guardian"
      leveling_status: "ACTIVE" | "COMPLETED" | "PENDING"
      plan_type: "BASIC" | "PRO" | "ELITE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "admin", "guardian"],
      leveling_status: ["ACTIVE", "COMPLETED", "PENDING"],
      plan_type: ["BASIC", "PRO", "ELITE"],
    },
  },
} as const
