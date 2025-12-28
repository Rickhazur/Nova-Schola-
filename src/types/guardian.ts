export type EducationLevel = 'PRIMARY' | 'HIGHSCHOOL';

export interface GuardianProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentWithGuardian {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  grade_level: number | null;
  guardian_id: string | null;
  guardian?: GuardianProfile | null;
  plan: 'BASIC' | 'PRO' | 'ELITE';
  tokens_used_this_month: number;
  token_allowance: number;
  onboarding_completed: boolean | null;
  created_at: string;
}

export interface CreateStudentData {
  full_name: string;
  email: string;
  password: string;
  level: EducationLevel;
}

export const levelLabels: Record<EducationLevel, string> = {
  PRIMARY: 'Primaria',
  HIGHSCHOOL: 'Bachillerato'
};

export const levelToGrade: Record<EducationLevel, number> = {
  PRIMARY: 3,
  HIGHSCHOOL: 9
};

export const gradeToLevel = (grade: number | null): EducationLevel => {
  if (!grade || grade <= 5) return 'PRIMARY';
  return 'HIGHSCHOOL';
};
