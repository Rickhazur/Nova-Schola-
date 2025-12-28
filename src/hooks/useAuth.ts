import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'student' | 'admin' | 'guardian';

export interface StudentProfile {
  id: string;
  user_id: string;
  full_name: string;
  grade_level: number | null;
  age: number | null;
  guardian_whatsapp: string | null;
  guardian_name: string | null;
  preferred_language: string;
  onboarding_completed: boolean;
  plan: 'BASIC' | 'PRO' | 'ELITE';
  token_allowance: number;
  tokens_used_this_month: number;
  token_reset_date: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to fetch role and profile together, only set loading=false when done
  const fetchUserData = async (userId: string, setLoadingFalse: boolean = false) => {
    const [roleResult, profileResult] = await Promise.all([
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      supabase.from('student_profiles').select('*').eq('user_id', userId).single()
    ]);
    
    if (roleResult.data && !roleResult.error) {
      setRole(roleResult.data.role as AppRole);
    }
    if (profileResult.data && !profileResult.error) {
      setProfile(profileResult.data as StudentProfile);
    }
    
    if (setLoadingFalse) {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!isMounted) return;
        
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        // When user signs out, clear everything
        if (!newSession?.user) {
          setRole(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          // Only refetch on actual sign in events
          fetchUserData(newSession.user.id, false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (!isMounted) return;
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        // Fetch role and profile, THEN set loading to false
        fetchUserData(existingSession.user.id, true);
      } else {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchStudentProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data && !error) {
      setProfile(data as StudentProfile);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    role: AppRole = 'student',
    fullName?: string,
    preferredLanguage: string = 'es',
    gradeLevel?: number
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          role,
          full_name: fullName || email,
          preferred_language: preferredLanguage,
          grade_level: gradeLevel
        }
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateProfile = async (updates: Partial<StudentProfile>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('student_profiles')
      .update(updates)
      .eq('user_id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    
    return { error };
  };

  const isPrimaryStudent = () => {
    if (!profile?.grade_level) return null;
    return profile.grade_level <= 5;
  };

  const isHighSchoolStudent = () => {
    if (!profile?.grade_level) return null;
    return profile.grade_level > 5;
  };

  return {
    user,
    session,
    role,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    isPrimaryStudent,
    isHighSchoolStudent,
    refetchProfile: () => user && fetchStudentProfile(user.id)
  };
}
