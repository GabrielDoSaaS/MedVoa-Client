import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: 'free' | 'premium';
  subscription_end: string | null;
}

export interface UsageLimits {
  doutor_ia_daily: number;
  quiz_monthly: number;
  cases_monthly: number;
  games_daily: number;
  games_monthly: number;
}

const FEATURE_LIMITS = {
  free: {
    doutor_ia_daily: 3,
    quiz_monthly: 3,
    cases_monthly: 3,
    games_daily: 1,
    games_monthly: 5,
    flashcards_ai: false,
    medplay_upload: false,
    file_manager: false,
  },
  premium: {
    doutor_ia_daily: Infinity,
    quiz_monthly: Infinity,
    cases_monthly: Infinity,
    games_daily: Infinity,
    games_monthly: Infinity,
    flashcards_ai: true,
    medplay_upload: true,
    file_manager: true,
  }
};

export const useSubscription = (user: User | null) => {
  // Initialize with premium assumption to prevent flickering for logged users
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: user ? true : false,
    subscription_tier: user ? 'premium' : 'free',
    subscription_end: null,
  });
  const [usage, setUsage] = useState<UsageLimits>({
    doutor_ia_daily: 0,
    quiz_monthly: 0,
    cases_monthly: 0,
    games_daily: 0,
    games_monthly: 0,
  });
  const [loading, setLoading] = useState(false); // Start as false to prevent initial loading state
  const [usageStore, setUsageStore] = useState<Record<string, any>>({});
  const [isReady, setIsReady] = useState(true); // Start as true for immediate rendering

  useEffect(() => {
    console.log('useSubscription: user changed', user ? 'User logged in' : 'No user');
    if (user) {
      // Check for cached subscription first
      const cachedSub = localStorage.getItem(`subscription_${user.id}`);
      if (cachedSub) {
        try {
          const parsed = JSON.parse(cachedSub);
          const cacheAge = Date.now() - parsed.timestamp;
          // Use cache if less than 30 seconds old
          if (cacheAge < 30000) {
            console.log('✅ Using cached subscription data');
            setSubscription(parsed.data);
            setLoading(false);
            setIsReady(true);
            loadUsageFromLocalStorage();
            return;
          }
        } catch (e) {
          console.log('Cache parse error:', e);
        }
      }
      
      checkSubscription();
      loadUsageFromLocalStorage();
    } else {
      setLoading(false);
      setIsReady(true);
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
      });
    }
  }, [user]);

  const checkSubscription = async () => {
    try {
      // Sistema fictício para testes - simula assinatura premium quando logado
      if (user) {
        console.log('✅ useSubscription: Usando sistema de assinatura fictício para testes');
        console.log('✅ useSubscription: Usuário encontrado:', user.id, user.email);
        const mockSubscription = {
          subscribed: true,
          subscription_tier: 'premium' as 'premium',
          subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        };
        console.log('✅ useSubscription: Configurando assinatura Premium fictícia:', mockSubscription);
        setSubscription(mockSubscription);
        
        // Cache the subscription data
        localStorage.setItem(`subscription_${user.id}`, JSON.stringify({
          data: mockSubscription,
          timestamp: Date.now()
        }));
        
        setLoading(false);
        setIsReady(true);
        return;
      }

      // Código original comentado para quando implementar Stripe real
      /*
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      if (data) {
        setSubscription(data);
      }
      */
    } catch (error) {
      console.error('Error checking subscription:', error);
      // Default to free plan on error
      setSubscription({
        subscribed: false,
        subscription_tier: 'free',
        subscription_end: null,
      });
    } finally {
      setLoading(false);
      setIsReady(true);
    }
  };

  const loadUsageFromLocalStorage = () => {
    if (!user) return;
    
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth() + '-' + new Date().getFullYear();
    
    const stored = localStorage.getItem(`usage_${user.id}`);
    if (stored) {
      const parsedUsage = JSON.parse(stored);
      
      // Reset daily counters if it's a new day
      if (parsedUsage.lastReset !== today) {
        parsedUsage.doutor_ia_daily = 0;
        parsedUsage.games_daily = 0;
        parsedUsage.lastReset = today;
      }
      
      // Reset monthly counters if it's a new month
      if (parsedUsage.lastMonthlyReset !== thisMonth) {
        parsedUsage.quiz_monthly = 0;
        parsedUsage.cases_monthly = 0;
        parsedUsage.games_monthly = 0;
        parsedUsage.lastMonthlyReset = thisMonth;
      }
      
      setUsage(parsedUsage);
      setUsageStore(parsedUsage);
      localStorage.setItem(`usage_${user.id}`, JSON.stringify(parsedUsage));
    }
  };

  const saveUsageToLocalStorage = (newUsage: UsageLimits) => {
    if (!user) return;
    
    const today = new Date().toDateString();
    const thisMonth = new Date().getMonth() + '-' + new Date().getFullYear();
    
    const usageToSave = {
      ...newUsage,
      lastReset: today,
      lastMonthlyReset: thisMonth,
    };
    
    localStorage.setItem(`usage_${user.id}`, JSON.stringify(usageToSave));
    setUsageStore(usageToSave);
  };

  const incrementUsage = async (featureName: string, type: 'daily' | 'monthly' = 'daily') => {
    if (!user) return false;

    const currentKey = `${featureName}_${type}` as keyof UsageLimits;
    const newUsage = {
      ...usage,
      [currentKey]: (usage[currentKey] || 0) + 1,
    };
    
    setUsage(newUsage);
    saveUsageToLocalStorage(newUsage);
    return true;
  };

  const canUseFeature = (featureName: string, type: 'daily' | 'monthly' = 'daily') => {
    const tier = subscription.subscription_tier;
    const limits = FEATURE_LIMITS[tier];
    
    if (tier === 'premium') return true;

    const currentUsage = usage[`${featureName}_${type}` as keyof UsageLimits] || 0;
    const limit = limits[`${featureName}_${type}` as keyof typeof limits] as number;
    
    return currentUsage < limit;
  };

  const canUseSpecialFeature = (featureName: 'flashcards_ai' | 'medplay_upload' | 'file_manager') => {
    const tier = subscription.subscription_tier;
    return FEATURE_LIMITS[tier][featureName];
  };

  const getRemainingUsage = (featureName: string, type: 'daily' | 'monthly' = 'daily') => {
    const tier = subscription.subscription_tier;
    const limits = FEATURE_LIMITS[tier];
    
    if (tier === 'premium') return Infinity;

    const currentUsage = usage[`${featureName}_${type}` as keyof UsageLimits] || 0;
    const limit = limits[`${featureName}_${type}` as keyof typeof limits] as number;
    
    return Math.max(0, limit - currentUsage);
  };

  const refreshSubscription = async () => {
    setLoading(true);
    await checkSubscription();
    loadUsageFromLocalStorage();
  };

  return {
    subscription,
    usage,
    loading,
    isReady,
    canUseFeature,
    canUseSpecialFeature,
    getRemainingUsage,
    incrementUsage,
    refreshSubscription,
    limits: FEATURE_LIMITS[subscription.subscription_tier],
  };
};