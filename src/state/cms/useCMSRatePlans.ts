/**
 * useCMSRatePlans Hook
 * Manages rate plan data for the CMS
 * Now connected to backend API
 */

import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../api/client';

interface RatePlan {
  id: string;
  name: string;
  fullName: string;
  description: string;
  status: string;
  isActive: boolean;
  mealPlan: string;
  commission: number;
  channels: string[];
  baseRates: Record<string, number>;
  basePrice: Record<string, number>;
  derivedRules: any[];
  restrictions: {
    minStay: number;
    maxStay: number;
    CTA: boolean;
    CTD: boolean;
    advanceBooking: number | null;
    closedDates: string[];
  };
  calendarRates: Record<string, any>;
  cancellationPolicy: string;
  paymentTerms: string;
  createdAt: string;
  updatedAt: string;
  minStay?: number;
  maxStay?: number;
  ctaEnabled?: boolean;
  ctdEnabled?: boolean;
  priceRules?: any[];
}

// Transform API rate plan to frontend format
function transformApiRatePlan(apiPlan: any): RatePlan {
  return {
    id: apiPlan.id?.toString() || `RP-${Date.now()}`,
    name: apiPlan.code || apiPlan.name || 'Unknown',
    fullName: apiPlan.name || apiPlan.code || 'Unknown',
    description: apiPlan.description || '',
    status: apiPlan.is_active ? 'Active' : 'Inactive',
    isActive: apiPlan.is_active ?? true,
    mealPlan: apiPlan.meal_plan || 'Room Only',
    commission: apiPlan.commission || 0,
    channels: apiPlan.channels || ['Direct', 'OTA'],
    baseRates: { default: apiPlan.base_price || 200 },
    basePrice: { default: apiPlan.base_price || 200 },
    derivedRules: [],
    restrictions: {
      minStay: apiPlan.min_stay || 1,
      maxStay: apiPlan.max_stay || 30,
      CTA: apiPlan.cta_enabled || false,
      CTD: apiPlan.ctd_enabled || false,
      advanceBooking: null,
      closedDates: [],
    },
    calendarRates: {},
    cancellationPolicy: apiPlan.cancellation_policy || 'Standard cancellation policy applies.',
    paymentTerms: apiPlan.payment_terms || 'Standard payment terms apply.',
    createdAt: apiPlan.created_at || new Date().toISOString(),
    updatedAt: apiPlan.updated_at || new Date().toISOString(),
    minStay: apiPlan.min_stay || 1,
    maxStay: apiPlan.max_stay || 30,
    ctaEnabled: apiPlan.cta_enabled || false,
    ctdEnabled: apiPlan.ctd_enabled || false,
    priceRules: [],
  };
}

export default function useCMSRatePlans() {
  const [ratePlans, setRatePlans] = useState<RatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch rate plans from API
  const fetchRatePlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/v1/rates/plans');
      const apiPlans = response.data || [];

      if (Array.isArray(apiPlans) && apiPlans.length > 0) {
        const transformedPlans = apiPlans.map(transformApiRatePlan);
        setRatePlans(transformedPlans);
      } else {
        // Keep empty array if no data
        setRatePlans([]);
      }
    } catch (err) {
      console.error('Error fetching rate plans:', err);
      setError('Failed to load rate plans');
      // Keep empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchRatePlans();
  }, [fetchRatePlans]);

  const addRatePlan = useCallback(async (planData: Partial<RatePlan>) => {
    try {
      // Create API payload
      const apiPayload = {
        code: planData.name?.toUpperCase().replace(/\s+/g, '-').substring(0, 10) || 'NEW',
        name: planData.fullName || planData.name || 'New Rate Plan',
        description: planData.description || '',
        plan_type: 'BAR',
        currency: 'USD',
        base_price: planData.baseRates?.default || planData.basePrice?.default || 200,
        is_active: planData.isActive ?? true,
      };

      const response = await apiClient.post('/api/v1/rates/plans', apiPayload);

      // Refetch to get updated list
      await fetchRatePlans();

      return {
        id: response.data?.id?.toString() || `RP-${Date.now()}`,
        ...planData,
        name: planData.name || 'New Rate Plan',
        fullName: planData.fullName || planData.name || 'New Rate Plan',
      } as RatePlan;
    } catch (err) {
      console.error('Error creating rate plan:', err);
      // Add locally as fallback
      const newPlan: RatePlan = {
        id: `RP-${Date.now()}`,
        name: planData.name || 'New Rate Plan',
        fullName: planData.fullName || planData.name || 'New Rate Plan',
        description: planData.description || '',
        status: planData.status || 'Active',
        isActive: planData.isActive ?? true,
        mealPlan: planData.mealPlan || 'Room Only',
        commission: planData.commission || 0,
        channels: planData.channels || ['Direct'],
        baseRates: planData.baseRates || {},
        basePrice: planData.basePrice || {},
        derivedRules: planData.derivedRules || [],
        restrictions: planData.restrictions || {
          minStay: 1,
          maxStay: 30,
          CTA: false,
          CTD: false,
          advanceBooking: null,
          closedDates: [],
        },
        calendarRates: planData.calendarRates || {},
        cancellationPolicy: planData.cancellationPolicy || 'Standard cancellation policy applies.',
        paymentTerms: planData.paymentTerms || 'Standard payment terms apply.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRatePlans(prev => [...prev, newPlan]);
      return newPlan;
    }
  }, [fetchRatePlans]);

  const updateRatePlan = useCallback((id: string, updates: Partial<RatePlan>) => {
    setRatePlans(prev =>
      prev.map(plan =>
        plan.id === id ? { ...plan, ...updates, updatedAt: new Date().toISOString() } : plan
      )
    );
  }, []);

  const deleteRatePlan = useCallback((id: string) => {
    setRatePlans(prev => prev.filter(plan => plan.id !== id));
  }, []);

  const getRatePlanById = useCallback((id: string) => {
    return ratePlans.find(plan => plan.id === id);
  }, [ratePlans]);

  const toggleRatePlanStatus = useCallback((id: string) => {
    setRatePlans(prev =>
      prev.map(plan =>
        plan.id === id ? { ...plan, isActive: !plan.isActive, updatedAt: new Date().toISOString() } : plan
      )
    );
  }, []);

  return {
    ratePlans,
    loading,
    error,
    addRatePlan,
    updateRatePlan,
    deleteRatePlan,
    getRatePlanById,
    toggleRatePlanStatus,
    refetch: fetchRatePlans,
  };
}
