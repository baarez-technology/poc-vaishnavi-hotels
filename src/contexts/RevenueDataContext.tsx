/**
 * Revenue Data Context - Optimized Version
 *
 * Features:
 * - Section-by-section loading (progressive UI updates)
 * - localStorage caching with TTL (instant load on return)
 * - Background refresh (show cached data, fetch in background)
 * - Request throttling/queuing (prevents system crashes)
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  revenueIntelligenceService,
  KPISummary,
  ForecastResponse,
  ChannelAnalysisResponse,
  SegmentPerformance,
  Competitor,
  PricingRecommendationsResponse,
  PickupMetricsResponse,
} from '../api/services/revenue-intelligence.service';

// ============================================================================
// TYPES
// ============================================================================

interface RevenueData {
  kpiSummary: KPISummary | null;
  forecast: ForecastResponse | null;
  channels: ChannelAnalysisResponse | null;
  segments: SegmentPerformance[] | null;
  competitors: Competitor[] | null;
  recommendations: PricingRecommendationsResponse | null;
  pickupMetrics: PickupMetricsResponse | null;
}

type SectionKey = keyof RevenueData;

interface SectionState {
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

interface SectionStates {
  kpiSummary: SectionState;
  forecast: SectionState;
  channels: SectionState;
  segments: SectionState;
  competitors: SectionState;
  recommendations: SectionState;
  pickupMetrics: SectionState;
}

interface RevenueDataContextValue {
  data: RevenueData;
  sectionStates: SectionStates;
  loading: boolean; // True only if ALL sections are loading
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => void; // Triggers background refresh of all sections
  refreshSection: (section: SectionKey) => void;
  isBackgroundRefreshing: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY_PREFIX = 'glimmora_revenue_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
const MAX_CONCURRENT_REQUESTS = 2; // Max parallel API calls
const REQUEST_DELAY = 200; // Delay between batches (ms)

const defaultSectionState: SectionState = {
  loading: false,
  error: null,
  lastUpdated: null,
};

const defaultData: RevenueData = {
  kpiSummary: null,
  forecast: null,
  channels: null,
  segments: null,
  competitors: null,
  recommendations: null,
  pickupMetrics: null,
};

const defaultSectionStates: SectionStates = {
  kpiSummary: { ...defaultSectionState },
  forecast: { ...defaultSectionState },
  channels: { ...defaultSectionState },
  segments: { ...defaultSectionState },
  competitors: { ...defaultSectionState },
  recommendations: { ...defaultSectionState },
  pickupMetrics: { ...defaultSectionState },
};

// Section fetch order (priority order)
const SECTION_ORDER: SectionKey[] = [
  'kpiSummary',      // Most important - shows KPIs first
  'forecast',        // Second - main chart
  'recommendations', // Third - actionable items
  'channels',        // Fourth - channel data
  'segments',        // Fifth - segment data
  'competitors',     // Sixth - competitor rates
  'pickupMetrics',   // Last - detailed metrics
];

// ============================================================================
// CACHE UTILITIES
// ============================================================================

interface CachedData<T> {
  data: T;
  timestamp: number;
}

function getCachedData<T>(key: SectionKey): T | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!cached) return null;

    const parsed: CachedData<T> = JSON.parse(cached);
    const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;

    // Return data even if expired (we'll refresh in background)
    return parsed.data;
  } catch {
    return null;
  }
}

function setCachedData<T>(key: SectionKey, data: T): void {
  try {
    const cacheEntry: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(`${CACHE_KEY_PREFIX}${key}`, JSON.stringify(cacheEntry));
  } catch (err) {
    // localStorage might be full or disabled
    console.warn('Failed to cache revenue data:', err);
  }
}

function getCacheTimestamp(key: SectionKey): number | null {
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${key}`);
    if (!cached) return null;
    const parsed: CachedData<unknown> = JSON.parse(cached);
    return parsed.timestamp;
  } catch {
    return null;
  }
}

function isCacheStale(key: SectionKey): boolean {
  const timestamp = getCacheTimestamp(key);
  if (!timestamp) return true;
  return Date.now() - timestamp > CACHE_TTL;
}

// ============================================================================
// REQUEST QUEUE
// ============================================================================

type QueuedRequest = () => Promise<void>;

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private running = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  add(request: QueuedRequest): void {
    this.queue.push(request);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 && this.running < this.maxConcurrent) {
      const request = this.queue.shift();
      if (request) {
        this.running++;
        try {
          await request();
        } finally {
          this.running--;
          // Small delay between requests to prevent overwhelming the server
          await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
          this.processQueue();
        }
      }
    }
  }

  clear(): void {
    this.queue = [];
  }

  get pendingCount(): number {
    return this.queue.length + this.running;
  }
}

// ============================================================================
// SECTION FETCHERS
// ============================================================================

const sectionFetchers: Record<SectionKey, () => Promise<unknown>> = {
  kpiSummary: () => revenueIntelligenceService.getKPISummary(),
  forecast: () => revenueIntelligenceService.getForecast(),
  channels: () => revenueIntelligenceService.getChannelAnalysis(),
  segments: () => revenueIntelligenceService.getSegmentPerformance(),
  competitors: () => revenueIntelligenceService.getCompetitors(),
  recommendations: () => revenueIntelligenceService.getPricingRecommendations(),
  pickupMetrics: () => revenueIntelligenceService.getPickupMetrics(14),
};

// ============================================================================
// CONTEXT
// ============================================================================

const RevenueDataContext = createContext<RevenueDataContextValue | undefined>(undefined);

export function RevenueDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<RevenueData>(() => {
    // Initialize with cached data for instant display
    return {
      kpiSummary: getCachedData<KPISummary>('kpiSummary'),
      forecast: getCachedData<ForecastResponse>('forecast'),
      channels: getCachedData<ChannelAnalysisResponse>('channels'),
      segments: getCachedData<SegmentPerformance[]>('segments'),
      competitors: getCachedData<Competitor[]>('competitors'),
      recommendations: getCachedData<PricingRecommendationsResponse>('recommendations'),
      pickupMetrics: getCachedData<PickupMetricsResponse>('pickupMetrics'),
    };
  });

  const [sectionStates, setSectionStates] = useState<SectionStates>(() => {
    // Check cache timestamps to set initial states
    const states = { ...defaultSectionStates };
    for (const key of SECTION_ORDER) {
      const timestamp = getCacheTimestamp(key);
      if (timestamp) {
        states[key] = {
          loading: false,
          error: null,
          lastUpdated: timestamp,
        };
      }
    }
    return states;
  });

  const [isBackgroundRefreshing, setIsBackgroundRefreshing] = useState(false);
  const requestQueueRef = useRef(new RequestQueue(MAX_CONCURRENT_REQUESTS));
  const mountedRef = useRef(true);
  const initialLoadDoneRef = useRef(false);

  // Update section state helper
  const updateSectionState = useCallback((section: SectionKey, update: Partial<SectionState>) => {
    if (!mountedRef.current) return;
    setSectionStates(prev => ({
      ...prev,
      [section]: { ...prev[section], ...update },
    }));
  }, []);

  // Update section data helper
  const updateSectionData = useCallback((section: SectionKey, newData: unknown) => {
    if (!mountedRef.current) return;
    setData(prev => ({ ...prev, [section]: newData }));
    // Cache the new data
    if (newData !== null) {
      setCachedData(section, newData);
    }
  }, []);

  // Fetch a single section
  const fetchSection = useCallback(async (section: SectionKey, isBackground = false) => {
    if (!isBackground) {
      updateSectionState(section, { loading: true, error: null });
    }

    try {
      const fetcher = sectionFetchers[section];
      const result = await fetcher();

      if (mountedRef.current) {
        updateSectionData(section, result);
        updateSectionState(section, {
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      }
    } catch (err) {
      console.error(`Failed to fetch ${section}:`, err);
      if (mountedRef.current) {
        updateSectionState(section, {
          loading: false,
          error: err instanceof Error ? err.message : 'Failed to load',
        });
      }
    }
  }, [updateSectionData, updateSectionState]);

  // Queue section fetch
  const queueSectionFetch = useCallback((section: SectionKey, isBackground = false) => {
    requestQueueRef.current.add(() => fetchSection(section, isBackground));
  }, [fetchSection]);

  // Refresh a single section (public API)
  const refreshSection = useCallback((section: SectionKey) => {
    queueSectionFetch(section, false);
  }, [queueSectionFetch]);

  // Refresh all sections in background
  const refresh = useCallback(() => {
    setIsBackgroundRefreshing(true);

    // Clear any pending requests
    requestQueueRef.current.clear();

    // Queue all sections for refresh (in priority order)
    for (const section of SECTION_ORDER) {
      queueSectionFetch(section, true);
    }

    // Monitor when all refreshes are done
    const checkComplete = setInterval(() => {
      if (requestQueueRef.current.pendingCount === 0) {
        clearInterval(checkComplete);
        if (mountedRef.current) {
          setIsBackgroundRefreshing(false);
        }
      }
    }, 500);
  }, [queueSectionFetch]);

  // Initial load - section by section, with priority
  useEffect(() => {
    if (initialLoadDoneRef.current) return;
    initialLoadDoneRef.current = true;

    // Determine which sections need fetching
    const sectionsToFetch: SectionKey[] = [];
    const sectionsToBackgroundRefresh: SectionKey[] = [];

    for (const section of SECTION_ORDER) {
      const hasCache = data[section] !== null;
      const isStale = isCacheStale(section);

      if (!hasCache) {
        // No cache - need to fetch with loading state
        sectionsToFetch.push(section);
      } else if (isStale) {
        // Have cache but stale - background refresh
        sectionsToBackgroundRefresh.push(section);
      }
    }

    // Set loading state for sections that need fetching
    if (sectionsToFetch.length > 0) {
      setSectionStates(prev => {
        const newStates = { ...prev };
        for (const section of sectionsToFetch) {
          newStates[section] = { ...newStates[section], loading: true };
        }
        return newStates;
      });
    }

    // Queue fetches for sections without cache
    for (const section of sectionsToFetch) {
      queueSectionFetch(section, false);
    }

    // Queue background refreshes for stale cache
    if (sectionsToBackgroundRefresh.length > 0) {
      setIsBackgroundRefreshing(true);
      for (const section of sectionsToBackgroundRefresh) {
        queueSectionFetch(section, true);
      }

      // Monitor completion
      const checkComplete = setInterval(() => {
        if (requestQueueRef.current.pendingCount === 0) {
          clearInterval(checkComplete);
          if (mountedRef.current) {
            setIsBackgroundRefreshing(false);
          }
        }
      }, 500);
    }
  }, [data, queueSectionFetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      requestQueueRef.current.clear();
    };
  }, []);

  // Computed: overall loading (true only if ALL sections are loading)
  const loading = Object.values(sectionStates).every(s => s.loading);

  // Computed: first error found
  const error = Object.values(sectionStates).find(s => s.error)?.error || null;

  // Computed: most recent update
  const lastUpdated = (() => {
    const timestamps = Object.values(sectionStates)
      .map(s => s.lastUpdated)
      .filter((t): t is number => t !== null);
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  })();

  const value: RevenueDataContextValue = {
    data,
    sectionStates,
    loading,
    error,
    lastUpdated,
    refresh,
    refreshSection,
    isBackgroundRefreshing,
  };

  return (
    <RevenueDataContext.Provider value={value}>
      {children}
    </RevenueDataContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useRevenueData() {
  const context = useContext(RevenueDataContext);
  if (context === undefined) {
    throw new Error('useRevenueData must be used within a RevenueDataProvider');
  }
  return context;
}

// Convenience hooks for specific data with section-level loading state
export function useKPISummary() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.kpiSummary,
    loading: sectionStates.kpiSummary.loading,
    error: sectionStates.kpiSummary.error,
    refresh: () => refreshSection('kpiSummary'),
  };
}

export function useForecast() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.forecast,
    loading: sectionStates.forecast.loading,
    error: sectionStates.forecast.error,
    refresh: () => refreshSection('forecast'),
  };
}

export function useChannels() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.channels,
    loading: sectionStates.channels.loading,
    error: sectionStates.channels.error,
    refresh: () => refreshSection('channels'),
  };
}

export function useSegments() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.segments,
    loading: sectionStates.segments.loading,
    error: sectionStates.segments.error,
    refresh: () => refreshSection('segments'),
  };
}

export function useCompetitors() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.competitors,
    loading: sectionStates.competitors.loading,
    error: sectionStates.competitors.error,
    refresh: () => refreshSection('competitors'),
  };
}

export function useRecommendations() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.recommendations,
    loading: sectionStates.recommendations.loading,
    error: sectionStates.recommendations.error,
    refresh: () => refreshSection('recommendations'),
  };
}

export function usePickupMetrics() {
  const { data, sectionStates, refreshSection } = useRevenueData();
  return {
    data: data.pickupMetrics,
    loading: sectionStates.pickupMetrics.loading,
    error: sectionStates.pickupMetrics.error,
    refresh: () => refreshSection('pickupMetrics'),
  };
}
