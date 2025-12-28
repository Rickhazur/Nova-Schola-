import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect, useCallback } from 'react';

export type PlanType = 'BASIC' | 'PRO' | 'ELITE';

export interface SubscriptionInfo {
  plan: PlanType;
  tokenAllowance: number;
  tokensUsedThisMonth: number;
  tokenResetDate: string;
  tokensRemaining: number;
  isAtLimit: boolean;
}

export interface PlanFeatures {
  sessionsPerMonth: number | 'unlimited';
  socraticTutor: boolean;
  levelingPlan: boolean;
  classroomSync: boolean;
  weeklyWhatsAppReports: boolean;
  arenaAccess: boolean;
  storeAccess: boolean;
  careerPathfinder: boolean;
  prioritySupport: boolean;
  advancedAnalytics: boolean;
}

const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  BASIC: {
    sessionsPerMonth: 5,
    socraticTutor: true,
    levelingPlan: false,
    classroomSync: false,
    weeklyWhatsAppReports: false,
    arenaAccess: false,
    storeAccess: false,
    careerPathfinder: false,
    prioritySupport: false,
    advancedAnalytics: false,
  },
  PRO: {
    sessionsPerMonth: 20,
    socraticTutor: true,
    levelingPlan: true,
    classroomSync: true,
    weeklyWhatsAppReports: true,
    arenaAccess: true,
    storeAccess: true,
    careerPathfinder: false,
    prioritySupport: false,
    advancedAnalytics: false,
  },
  ELITE: {
    sessionsPerMonth: 'unlimited',
    socraticTutor: true,
    levelingPlan: true,
    classroomSync: true,
    weeklyWhatsAppReports: true,
    arenaAccess: true,
    storeAccess: true,
    careerPathfinder: true,
    prioritySupport: true,
    advancedAnalytics: true,
  },
};

const DEFAULT_TOKEN_ALLOWANCES: Record<PlanType, number> = {
  BASIC: 50,
  PRO: 200,
  ELITE: 1000,
};

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('student_profiles')
        .select('plan, token_allowance, tokens_used_this_month, token_reset_date')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const tokensRemaining = data.token_allowance - data.tokens_used_this_month;
        setSubscription({
          plan: data.plan as PlanType,
          tokenAllowance: data.token_allowance,
          tokensUsedThisMonth: data.tokens_used_this_month,
          tokenResetDate: data.token_reset_date,
          tokensRemaining: Math.max(0, tokensRemaining),
          isAtLimit: tokensRemaining <= 0,
        });
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const getPlanFeatures = (plan?: PlanType): PlanFeatures => {
    return PLAN_FEATURES[plan || subscription?.plan || 'BASIC'];
  };

  const canAccessFeature = (feature: keyof PlanFeatures): boolean => {
    if (!subscription) return false;
    return !!getPlanFeatures(subscription.plan)[feature];
  };

  const updatePlan = async (newPlan: PlanType): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const newAllowance = DEFAULT_TOKEN_ALLOWANCES[newPlan];
      
      const { error } = await supabase
        .from('student_profiles')
        .update({
          plan: newPlan,
          token_allowance: newAllowance,
          tokens_used_this_month: 0,
          token_reset_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchSubscription();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const resetTokens = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('student_profiles')
        .update({
          tokens_used_this_month: 0,
          token_reset_date: new Date().toISOString().split('T')[0],
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await fetchSubscription();
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return {
    subscription,
    loading,
    getPlanFeatures,
    canAccessFeature,
    updatePlan,
    resetTokens,
    refetch: fetchSubscription,
  };
}
