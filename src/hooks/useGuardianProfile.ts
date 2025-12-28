import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { GuardianProfile } from '@/types/guardian';

export function useGuardianProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<GuardianProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('guardian_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading };
}
