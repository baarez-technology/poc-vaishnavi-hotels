import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  revenueIntelligenceService,
  PricingRule,
  PricingRecommendation,
  ForecastItem,
  PickupMetricsResponse,
  CompetitorInsightsResponse,
  SegmentPerformance,
  KPISummary,
  Event,
} from '../api/services/revenue-intelligence.service';
import { generateRateCalendar, roomTypes, rateCodes, seasonalityFactors, dayOfWeekFactors, specialEvents } from '../data/rms/sampleRateHistory';
import { generatePickupData, calculatePickupMetrics } from '../data/rms/samplePickup';
import { generateCompetitorRates, getCompetitorInsights, checkRateParity, competitors } from '../data/rms/sampleCompetitors';
import { generateForecast, calculateForecastSummary, generateForecastInsights, getHighImpactDays, getOpportunityDays } from '../data/rms/sampleForecast';
import { generateSegmentPerformance, getSegmentComparison, segments } from '../data/rms/sampleSegments';
import { calculateRuleBasedRate, getRuleAnalytics } from '../data/rms/sampleRules';

// History action types
type HistoryAction =
  | { type: 'updateRate'; roomTypeId: string; date: string; oldRate: number; newRate: number; reason?: string }
  | { type: 'applyRestriction'; roomTypeId: string; date: string; restriction: any }
  | { type: 'bulkRateUpdate'; changes: Array<{ roomTypeId: string; date: string; oldRate: number; newRate: number }> }
  | { type: 'applyRule'; ruleId: number; affectedDates: string[] };

interface HistoryItem {
  action: HistoryAction;
  beforeState: any;
  afterState: any;
  timestamp: string;
  description: string;
}

interface RMSContextType {
  // State
  rateCalendar: any;
  rules: PricingRule[];
  forecast: ForecastItem[];
  pickup: any;
  competitors: any;
  segmentPerformance: SegmentPerformance[];
  recommendations: PricingRecommendation[];
  events: Event[];
  kpis: KPISummary | null;
  lastRecalculation: string;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  // Static data
  roomTypes: typeof roomTypes;
  rateCodes: typeof rateCodes;
  segments: typeof segments;

  // Undo/Redo
  undo: () => boolean;
  redo: () => boolean;
  clearHistory: () => void;
  canUndo: boolean;
  canRedo: boolean;
  history: HistoryItem[];
  historyIndex: number;
  lastAction: HistoryItem | null;

  // Rate Calendar functions
  getRateForDate: (roomTypeId: string, date: string | Date) => any;
  updateRate: (roomTypeId: string, date: string | Date, newRate: number, reason?: string) => Promise<void>;
  bulkUpdateRates: (updates: Array<{ roomTypeId: string; date: string; rate: number }>) => Promise<void>;
  applyRestriction: (roomTypeId: string, date: string | Date, restriction: any) => void;
  applyPromotion: (roomTypeId: string, date: string | Date, promo: any) => void;

  // Dynamic Pricing
  calculateDynamicRate: (roomTypeId: string, date: string | Date, inputs?: any) => any;

  // Rules Engine
  applyRulesForDate: (date: string | Date, roomTypeId?: string) => any[];
  runAllRules: () => Promise<any[]>;
  addRule: (rule: Partial<PricingRule>) => Promise<PricingRule>;
  updateRule: (ruleId: number, updates: Partial<PricingRule>) => Promise<void>;
  deleteRule: (ruleId: number) => Promise<void>;
  toggleRule: (ruleId: number) => Promise<void>;
  refreshRules: () => Promise<void>;

  // Forecast
  refreshForecast: () => Promise<void>;
  runForecast: () => Promise<void>;
  simulateDemandSurge: (date: string | Date, multiplier?: number) => void;
  simulateDemandDrop: (date: string | Date, multiplier?: number) => void;
  forecastSummary: any;
  forecastInsights: any;
  highImpactDays: ForecastItem[];
  opportunityDays: ForecastItem[];

  // Pickup
  refreshPickup: () => Promise<void>;
  updatePickup: () => any;
  calculatePickupByDate: (date: string | Date) => any;
  compareToHistorical: (date: string | Date) => any;
  predictPickup: (date: string | Date) => any;
  pickupMetrics: any;

  // Competitors
  refreshCompetitors: () => Promise<void>;
  updateCompetitorRates: () => any;
  calculateRateParity: () => any[];
  detectUnderpricing: () => any[];
  detectOverpricing: () => any[];
  competitorInsights: CompetitorInsightsResponse | null;
  parityIssues: any[];

  // Segments
  refreshSegments: () => Promise<void>;
  updateSegmentPerformance: () => any;
  calculateSegmentADR: (segmentId: string) => number;
  calculateSegmentContribution: (segmentId: string) => number;
  segmentComparison: any;

  // KPIs
  refreshKPIs: () => Promise<void>;

  // Events
  refreshEvents: () => Promise<void>;

  // Rules Analytics
  ruleAnalytics: any;

  // AI Recommendations
  applyRecommendation: (recommendation: PricingRecommendation) => Promise<void>;
  dismissRecommendation: (id: string) => Promise<void>;
  generateRecommendations: () => Promise<PricingRecommendation[]>;
  refreshRecommendations: () => Promise<void>;
  applyAllRecommendations: () => Promise<void>;

  // Refresh All
  refreshAll: () => Promise<void>;
}

const RMSContext = createContext<RMSContextType | null>(null);

export function useRMS() {
  const context = useContext(RMSContext);
  if (!context) {
    throw new Error('useRMS must be used within RMSProvider');
  }
  return context;
}

export function RMSProvider({ children }: { children: React.ReactNode }) {
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Core state - initialized with sample data, updated from API
  const [rateCalendar, setRateCalendar] = useState(() => generateRateCalendar());
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [pickup, setPickup] = useState(() => generatePickupData());
  const [pickupApiData, setPickupApiData] = useState<PickupMetricsResponse | null>(null);
  const [competitorsData, setCompetitorsData] = useState(() => generateCompetitorRates());
  const [competitorInsightsApi, setCompetitorInsightsApi] = useState<CompetitorInsightsResponse | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [localForecast, setLocalForecast] = useState(() => generateForecast());
  const [segmentPerformance, setSegmentPerformance] = useState<SegmentPerformance[]>([]);
  const [localSegmentPerformance, setLocalSegmentPerformance] = useState(() => generateSegmentPerformance());
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [kpis, setKpis] = useState<KPISummary | null>(null);
  const [lastRecalculation, setLastRecalculation] = useState(new Date().toISOString());

  // Undo/Redo state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const MAX_HISTORY_SIZE = 50;

  // Ref to track if initial data has been loaded
  const initialLoadRef = useRef(false);

  // ============================================
  // API DATA LOADING
  // ============================================

  const loadRules = useCallback(async () => {
    try {
      const apiRules = await revenueIntelligenceService.getPricingRules();
      setRules(apiRules);
    } catch (err) {
      console.error('Failed to load rules:', err);
      const { sampleRules } = await import('../data/rms/sampleRules');
      setRules(sampleRules as any);
    }
  }, []);

  const loadRecommendations = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getPricingRecommendations();
      setRecommendations(response.recommendations);
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  }, []);

  const loadForecast = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 90);

      const response = await revenueIntelligenceService.getForecast({
        start_date: today.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
      });
      setForecast(response.forecasts || []);
    } catch (err) {
      console.error('Failed to load forecast:', err);
    }
  }, []);

  const loadPickup = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getPickupMetrics(30);
      setPickupApiData(response);
    } catch (err) {
      console.error('Failed to load pickup:', err);
    }
  }, []);

  const loadCompetitors = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getCompetitorInsights();
      setCompetitorInsightsApi(response);
    } catch (err) {
      console.error('Failed to load competitor insights:', err);
    }
  }, []);

  const loadSegments = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getSegmentPerformance();
      setSegmentPerformance(response);
    } catch (err) {
      console.error('Failed to load segments:', err);
    }
  }, []);

  const loadKPIs = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getKPISummary();
      setKpis(response);
    } catch (err) {
      console.error('Failed to load KPIs:', err);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 90);

      const response = await revenueIntelligenceService.getEvents(
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      setEvents(response);
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  }, []);

  const loadRateCalendar = useCallback(async () => {
    try {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() + 60);

      const calendarData = await revenueIntelligenceService.getRateCalendar(
        today.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      if (calendarData?.days) {
        const calendarMap: any = {};
        calendarData.days.forEach((day) => {
          calendarMap[day.date] = day;
        });
        setRateCalendar((prev: any) => ({ ...prev, ...calendarMap }));
      }
    } catch (err) {
      console.error('Failed to load rate calendar:', err);
    }
  }, []);

  // Load initial data from APIs
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          loadRules(),
          loadRecommendations(),
          loadForecast(),
          loadPickup(),
          loadCompetitors(),
          loadSegments(),
          loadKPIs(),
          loadEvents(),
          loadRateCalendar(),
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Some data failed to load. Using cached data where available.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [loadRules, loadRecommendations, loadForecast, loadPickup, loadCompetitors, loadSegments, loadKPIs, loadEvents, loadRateCalendar]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    setError(null);

    try {
      await Promise.all([
        loadRules(),
        loadRecommendations(),
        loadForecast(),
        loadPickup(),
        loadCompetitors(),
        loadSegments(),
        loadKPIs(),
        loadEvents(),
        loadRateCalendar(),
      ]);
      setLastRecalculation(new Date().toISOString());
    } catch (err) {
      console.error('Failed to refresh data:', err);
      setError('Failed to refresh some data.');
    } finally {
      setIsSyncing(false);
    }
  }, [loadRules, loadRecommendations, loadForecast, loadPickup, loadCompetitors, loadSegments, loadKPIs, loadEvents, loadRateCalendar]);

  // ============================================
  // UNDO/REDO FUNCTIONS
  // ============================================

  const addToHistory = useCallback((action: HistoryAction, beforeState: any, afterState: any, description: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({
        action,
        beforeState,
        afterState,
        timestamp: new Date().toISOString(),
        description,
      });
      if (newHistory.length > MAX_HISTORY_SIZE) {
        return newHistory.slice(-MAX_HISTORY_SIZE);
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY_SIZE - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return false;
    const historyItem = history[historyIndex];
    if (!historyItem) return false;

    // Restore the before state
    setRateCalendar(historyItem.beforeState);
    setHistoryIndex(prev => prev - 1);

    // Attempt to sync the undo to the API (best effort)
    if (historyItem.action.type === 'updateRate') {
      const { roomTypeId, date, oldRate } = historyItem.action;
      revenueIntelligenceService.updateRate(roomTypeId, date, { rate: oldRate, reason: 'Undo' })
        .catch(err => console.error('Failed to sync undo to API:', err));
    }

    return true;
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return false;
    const historyItem = history[historyIndex + 1];
    if (!historyItem) return false;

    // Restore the after state
    setRateCalendar(historyItem.afterState);
    setHistoryIndex(prev => prev + 1);

    // Attempt to sync the redo to the API (best effort)
    if (historyItem.action.type === 'updateRate') {
      const { roomTypeId, date, newRate, reason } = historyItem.action;
      revenueIntelligenceService.updateRate(roomTypeId, date, { rate: newRate, reason: reason || 'Redo' })
        .catch(err => console.error('Failed to sync redo to API:', err));
    }

    return true;
  }, [history, historyIndex]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;
  const lastAction = historyIndex >= 0 ? history[historyIndex] : null;

  // ============================================
  // RATE CALENDAR FUNCTIONS
  // ============================================

  const getRateForDate = useCallback((roomTypeId: string, date: string | Date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return rateCalendar[dateStr]?.rooms?.[roomTypeId] || null;
  }, [rateCalendar]);

  const updateRate = useCallback(async (
    roomTypeId: string,
    date: string | Date,
    newRate: number,
    reason = 'Manual override'
  ) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const oldRate = rateCalendar[dateStr]?.rooms?.[roomTypeId]?.dynamicRate || 0;

    // Store before state for history
    const beforeState = { ...rateCalendar };

    // Optimistic update
    setRateCalendar((prev: any) => {
      const updated = { ...prev };
      if (updated[dateStr]?.rooms?.[roomTypeId]) {
        updated[dateStr] = {
          ...updated[dateStr],
          rooms: {
            ...updated[dateStr].rooms,
            [roomTypeId]: {
              ...updated[dateStr].rooms[roomTypeId],
              dynamicRate: newRate,
              overrideRate: newRate,
              overrideReason: reason,
              rates: {
                ...updated[dateStr].rooms[roomTypeId].rates,
                BAR: newRate,
                OTA: Math.round(newRate * 1.15),
                CORP: Math.round(newRate * 0.80),
              },
            },
          },
        };
      }
      return updated;
    });

    // Add to history after state update
    const afterState = { ...rateCalendar };
    if (afterState[dateStr]?.rooms?.[roomTypeId]) {
      afterState[dateStr] = {
        ...afterState[dateStr],
        rooms: {
          ...afterState[dateStr].rooms,
          [roomTypeId]: {
            ...afterState[dateStr].rooms[roomTypeId],
            dynamicRate: newRate,
          },
        },
      };
    }

    addToHistory(
      { type: 'updateRate', roomTypeId, date: dateStr, oldRate, newRate, reason },
      beforeState,
      afterState,
      `Updated ${roomTypeId} rate for ${dateStr}: $${oldRate} -> $${newRate}`
    );

    // Sync to API
    try {
      await revenueIntelligenceService.updateRate(roomTypeId, dateStr, { rate: newRate, reason });
    } catch (err) {
      console.error('Failed to sync rate update to API:', err);
      // Optionally rollback on error
      // setRateCalendar(beforeState);
      // setHistoryIndex(prev => prev - 1);
      throw err;
    }
  }, [rateCalendar, addToHistory]);

  const bulkUpdateRates = useCallback(async (
    updates: Array<{ roomTypeId: string; date: string; rate: number }>
  ) => {
    const beforeState = { ...rateCalendar };
    const changes: Array<{ roomTypeId: string; date: string; oldRate: number; newRate: number }> = [];

    // Optimistic bulk update
    setRateCalendar((prev: any) => {
      const updated = { ...prev };
      updates.forEach(({ roomTypeId, date, rate }) => {
        const oldRate = prev[date]?.rooms?.[roomTypeId]?.dynamicRate || 0;
        changes.push({ roomTypeId, date, oldRate, newRate: rate });

        if (updated[date]?.rooms?.[roomTypeId]) {
          updated[date] = {
            ...updated[date],
            rooms: {
              ...updated[date].rooms,
              [roomTypeId]: {
                ...updated[date].rooms[roomTypeId],
                dynamicRate: rate,
                overrideRate: rate,
                rates: {
                  ...updated[date].rooms[roomTypeId].rates,
                  BAR: rate,
                  OTA: Math.round(rate * 1.15),
                  CORP: Math.round(rate * 0.80),
                },
              },
            },
          };
        }
      });
      return updated;
    });

    // Add to history
    addToHistory(
      { type: 'bulkRateUpdate', changes },
      beforeState,
      rateCalendar,
      `Bulk updated ${updates.length} rates`
    );

    // Sync to API
    try {
      await revenueIntelligenceService.bulkUpdateRates(
        updates.map(u => ({ roomTypeId: parseInt(u.roomTypeId) || 0, date: u.date, rate: u.rate }))
      );
    } catch (err) {
      console.error('Failed to sync bulk rate update to API:', err);
      throw err;
    }
  }, [rateCalendar, addToHistory]);

  const applyRestriction = useCallback((roomTypeId: string, date: string | Date, restriction: any) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    setRateCalendar((prev: any) => {
      const updated = { ...prev };
      if (updated[dateStr]?.rooms?.[roomTypeId]) {
        updated[dateStr] = {
          ...updated[dateStr],
          rooms: {
            ...updated[dateStr].rooms,
            [roomTypeId]: {
              ...updated[dateStr].rooms[roomTypeId],
              restrictions: {
                ...updated[dateStr].rooms[roomTypeId].restrictions,
                ...restriction,
              },
            },
          },
        };
      }
      return updated;
    });
  }, []);

  const applyPromotion = useCallback((roomTypeId: string, date: string | Date, promo: any) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const currentRate = getRateForDate(roomTypeId, dateStr);
    if (currentRate) {
      const discountedRate = Math.round(currentRate.dynamicRate * (1 - promo.discountPercent / 100));
      updateRate(roomTypeId, dateStr, discountedRate, `Promo: ${promo.name}`);
    }
  }, [getRateForDate, updateRate]);

  // ============================================
  // DYNAMIC PRICING ENGINE
  // ============================================

  const calculateDynamicRate = useCallback((roomTypeId: string, date: string | Date, inputs: any = {}) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const dateObj = new Date(dateStr);
    const roomType = roomTypes.find(r => r.id === roomTypeId);
    if (!roomType) return null;

    const baseRate = roomType.baseRate;
    const month = dateObj.getMonth() + 1;
    const dayOfWeek = dateObj.getDay();
    const daysOut = Math.ceil((dateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const seasonFactor = seasonalityFactors[month] || 1.0;
    const dowFactor = dayOfWeekFactors[dayOfWeek] || 1.0;
    const event = specialEvents.find(e => e.date === dateStr);
    const eventFactor = event ? event.factor : 1.0;

    const occupancy = inputs.occupancy || rateCalendar[dateStr]?.occupancy || 70;
    let occupancyFactor = 1.0;
    if (occupancy >= 90) occupancyFactor = 1.25;
    else if (occupancy >= 80) occupancyFactor = 1.15;
    else if (occupancy >= 70) occupancyFactor = 1.05;
    else if (occupancy >= 50) occupancyFactor = 0.95;
    else occupancyFactor = 0.85;

    let leadTimeFactor = 1.0;
    if (daysOut <= 1) leadTimeFactor = 1.20;
    else if (daysOut <= 3) leadTimeFactor = 1.10;
    else if (daysOut <= 7) leadTimeFactor = 1.05;
    else if (daysOut <= 14) leadTimeFactor = 1.0;
    else if (daysOut <= 30) leadTimeFactor = 0.95;
    else leadTimeFactor = 0.90;

    const competitorData = competitorsData[dateStr];
    let competitorFactor = 1.0;
    if (competitorData?.analysis) {
      const gap = competitorData.analysis.rateGapPercent;
      if (gap < -15) competitorFactor = 1.10;
      else if (gap < -5) competitorFactor = 1.05;
      else if (gap > 15) competitorFactor = 0.95;
      else if (gap > 5) competitorFactor = 0.98;
    }

    const pickupData = pickup[dateStr];
    let demandFactor = 1.0;
    if (pickupData) {
      if (pickupData.paceStatus === 'strong') demandFactor = 1.12;
      else if (pickupData.paceStatus === 'on-pace') demandFactor = 1.0;
      else if (pickupData.paceStatus === 'slow') demandFactor = 0.92;
      else demandFactor = 0.85;
    }

    const promoDiscount = inputs.promoDiscount || 0;

    const dynamicRate = Math.round(
      baseRate * seasonFactor * dowFactor * eventFactor *
      occupancyFactor * leadTimeFactor * competitorFactor *
      demandFactor * (1 - promoDiscount / 100)
    );

    return {
      baseRate,
      dynamicRate,
      factors: {
        seasonality: seasonFactor,
        dayOfWeek: dowFactor,
        event: eventFactor,
        occupancy: occupancyFactor,
        leadTime: leadTimeFactor,
        competitor: competitorFactor,
        demand: demandFactor,
        promo: 1 - promoDiscount / 100,
      },
      adjustment: dynamicRate - baseRate,
      adjustmentPercent: Math.round(((dynamicRate - baseRate) / baseRate) * 100),
    };
  }, [rateCalendar, competitorsData, pickup]);

  // ============================================
  // PRICING RULES ENGINE
  // ============================================

  const applyRulesForDate = useCallback((date: string | Date, roomTypeId = 'ALL') => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const dateObj = new Date(dateStr);
    const daysOut = Math.ceil((dateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    const results: any[] = [];
    const roomTypesToProcess = roomTypeId === 'ALL'
      ? roomTypes
      : roomTypes.filter(r => r.id === roomTypeId);

    roomTypesToProcess.forEach(room => {
      const calendarData = rateCalendar[dateStr];
      const roomData = calendarData?.rooms?.[room.id];
      if (!roomData) return;

      const forecastData = forecast.find(f => f.date === dateStr);

      const context = {
        roomType: room.id,
        occupancy: calendarData.occupancy,
        pickupPace: pickup[dateStr]?.bookingProgress || 50,
        competitorGap: competitorsData[dateStr]?.analysis?.rateGapPercent || 0,
        daysOut,
        dayOfWeek: dateObj.getDay(),
        demandLevel: forecastData?.demand_level || 'moderate',
        segment: 'direct',
        hasEvent: !!calendarData.event,
      };

      const ruleResult = calculateRuleBasedRate(rules, roomData.baseRate, context);

      if (ruleResult.appliedRules.length > 0) {
        results.push({
          roomType: room.id,
          roomTypeName: room.name,
          date: dateStr,
          ...ruleResult,
        });

        if (ruleResult.rate !== roomData.dynamicRate) {
          updateRate(room.id, dateStr, ruleResult.rate, `Rule: ${ruleResult.appliedRules.map((r: any) => r.ruleName).join(', ')}`);
        }
      }
    });

    return results;
  }, [rateCalendar, pickup, competitorsData, forecast, rules, updateRate]);

  const runAllRules = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await revenueIntelligenceService.executePricingRules();
      setLastRecalculation(response.executedAt);

      // Refresh rate calendar after rules execution
      await loadRateCalendar();

      return response.results;
    } catch (err) {
      console.error('Failed to execute rules via API:', err);
      // Fall back to local execution
      const results: any[] = [];
      const dates = Object.keys(rateCalendar).slice(0, 90);
      dates.forEach(date => {
        const dateResults = applyRulesForDate(date, 'ALL');
        results.push(...dateResults);
      });
      setLastRecalculation(new Date().toISOString());
      return results;
    } finally {
      setIsSyncing(false);
    }
  }, [rateCalendar, applyRulesForDate, loadRateCalendar]);

  // Rule CRUD operations with API persistence
  const addRule = useCallback(async (rule: Partial<PricingRule>) => {
    try {
      const newRule = await revenueIntelligenceService.createPricingRule({
        name: rule.name || 'New Rule',
        description: rule.description,
        priority: rule.priority || 1,
        isActive: rule.isActive ?? true,
        roomTypes: rule.roomTypes || [],
        conditions: rule.conditions || [],
        actions: rule.actions || [],
      });
      setRules(prev => [...prev, newRule]);
      return newRule;
    } catch (err) {
      console.error('Failed to create rule:', err);
      throw err;
    }
  }, []);

  const updateRuleData = useCallback(async (ruleId: number, updates: Partial<PricingRule>) => {
    // Optimistic update
    const oldRules = [...rules];
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, ...updates } : r));

    try {
      await revenueIntelligenceService.updatePricingRule(ruleId, updates);
    } catch (err) {
      console.error('Failed to update rule:', err);
      // Rollback on error
      setRules(oldRules);
      throw err;
    }
  }, [rules]);

  const deleteRule = useCallback(async (ruleId: number) => {
    // Optimistic update
    const oldRules = [...rules];
    setRules(prev => prev.filter(r => r.id !== ruleId));

    try {
      await revenueIntelligenceService.deletePricingRule(ruleId);
    } catch (err) {
      console.error('Failed to delete rule:', err);
      // Rollback on error
      setRules(oldRules);
      throw err;
    }
  }, [rules]);

  const toggleRule = useCallback(async (ruleId: number) => {
    // Optimistic update
    const oldRules = [...rules];
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, isActive: !r.isActive } : r));

    try {
      await revenueIntelligenceService.togglePricingRule(ruleId);
    } catch (err) {
      console.error('Failed to toggle rule:', err);
      // Rollback on error
      setRules(oldRules);
      throw err;
    }
  }, [rules]);

  const refreshRules = useCallback(async () => {
    await loadRules();
  }, [loadRules]);

  // ============================================
  // FORECAST FUNCTIONS
  // ============================================

  const refreshForecast = useCallback(async () => {
    await loadForecast();
  }, [loadForecast]);

  const runForecast = useCallback(async () => {
    setIsSyncing(true);
    try {
      await loadForecast();
      setLastRecalculation(new Date().toISOString());
    } finally {
      setIsSyncing(false);
    }
  }, [loadForecast]);

  const simulateDemandSurge = useCallback((date: string | Date, multiplier = 1.3) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    setForecast(prev => prev.map(f => {
      if (f.date !== dateStr) return f;
      return {
        ...f,
        forecasted_demand: Math.round(f.forecasted_demand * multiplier),
        forecasted_occupancy: Math.min(98, Math.round(f.forecasted_occupancy * multiplier)),
        demand_level: multiplier >= 1.3 ? 'critical' : 'high',
      };
    }));
  }, []);

  const simulateDemandDrop = useCallback((date: string | Date, multiplier = 0.7) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    setForecast(prev => prev.map(f => {
      if (f.date !== dateStr) return f;
      return {
        ...f,
        forecasted_demand: Math.round(f.forecasted_demand * multiplier),
        forecasted_occupancy: Math.round(f.forecasted_occupancy * multiplier),
        demand_level: multiplier <= 0.7 ? 'very_low' : 'low',
      };
    }));
  }, []);

  // Computed forecast values
  const forecastSummary = useMemo(() => {
    if (forecast.length === 0) return calculateForecastSummary(localForecast);

    const avgOccupancy = forecast.reduce((sum, f) => sum + f.forecasted_occupancy, 0) / forecast.length;
    const avgConfidence = forecast.reduce((sum, f) => sum + f.confidence_level, 0) / forecast.length;
    const highDemandDays = forecast.filter(f => f.demand_level === 'critical' || f.demand_level === 'high').length;
    const lowDemandDays = forecast.filter(f => f.demand_level === 'low' || f.demand_level === 'very_low').length;

    return {
      avgOccupancy: Math.round(avgOccupancy),
      avgConfidence: Math.round(avgConfidence * 100),
      highDemandDays,
      lowDemandDays,
      totalDays: forecast.length,
    };
  }, [forecast, localForecast]);

  const forecastInsights = useMemo(() => {
    if (forecast.length === 0) return generateForecastInsights(localForecast);

    const insights: any[] = [];

    const highDemandDays = forecast.filter(f => f.demand_level === 'critical' || f.demand_level === 'high');
    if (highDemandDays.length >= 3) {
      const avgOccupancy = highDemandDays.reduce((sum, f) => sum + f.forecasted_occupancy, 0) / highDemandDays.length;
      insights.push({
        type: 'compression',
        title: 'Compression Period Detected',
        message: `${highDemandDays.length} high-demand days identified with avg ${Math.round(avgOccupancy)}% occupancy.`,
        potentialRevenue: Math.round(highDemandDays.length * 450),
      });
    }

    const lowDemandDays = forecast.filter(f => f.demand_level === 'low' || f.demand_level === 'very_low');
    if (lowDemandDays.length >= 5) {
      const avgOccupancy = lowDemandDays.reduce((sum, f) => sum + f.forecasted_occupancy, 0) / lowDemandDays.length;
      insights.push({
        type: 'weak_demand',
        title: 'Soft Demand Period',
        message: `${lowDemandDays.length} days with below-average demand (${Math.round(avgOccupancy)}% occupancy).`,
      });
    }

    return insights;
  }, [forecast, localForecast]);

  const highImpactDays = useMemo(() => {
    if (forecast.length === 0) return getHighImpactDays(localForecast);
    return forecast
      .filter(f => f.demand_level === 'critical' || f.demand_level === 'high')
      .sort((a, b) => b.forecasted_demand - a.forecasted_demand)
      .slice(0, 10);
  }, [forecast, localForecast]);

  const opportunityDays = useMemo(() => {
    if (forecast.length === 0) return getOpportunityDays(localForecast);
    return forecast
      .filter(f => f.demand_level === 'low' || f.demand_level === 'very_low')
      .sort((a, b) => a.forecasted_demand - b.forecasted_demand)
      .slice(0, 10);
  }, [forecast, localForecast]);

  // ============================================
  // PICKUP FUNCTIONS
  // ============================================

  const refreshPickup = useCallback(async () => {
    await loadPickup();
  }, [loadPickup]);

  const updatePickup = useCallback(() => {
    const newPickup = generatePickupData();
    setPickup(newPickup);
    return newPickup;
  }, []);

  const calculatePickupByDate = useCallback((date: string | Date) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    return pickup[dateStr] || null;
  }, [pickup]);

  const compareToHistorical = useCallback((date: string | Date) => {
    const pickupData = calculatePickupByDate(date);
    if (!pickupData) return null;
    return {
      vsLastYear: pickupData.comparisons?.lastYear,
      vsLastWeek: pickupData.comparisons?.lastWeek,
      paceStatus: pickupData.paceStatus,
      alerts: pickupData.alerts,
    };
  }, [calculatePickupByDate]);

  const predictPickup = useCallback((date: string | Date) => {
    const pickupData = calculatePickupByDate(date);
    if (!pickupData) return null;
    return {
      currentBookings: pickupData.currentBookings,
      predictedFinal: pickupData.predictedFinal,
      remainingToSell: pickupData.remainingToSell,
      confidence: Math.max(50, 95 - (pickupData.daysOut * 0.5)),
    };
  }, [calculatePickupByDate]);

  const pickupMetrics = useMemo(() => {
    if (pickupApiData) {
      return pickupApiData.summary;
    }
    return calculatePickupMetrics(pickup);
  }, [pickup, pickupApiData]);

  // ============================================
  // COMPETITOR FUNCTIONS
  // ============================================

  const refreshCompetitors = useCallback(async () => {
    await loadCompetitors();
  }, [loadCompetitors]);

  const updateCompetitorRates = useCallback(() => {
    const newCompetitors = generateCompetitorRates(new Date(), rateCalendar);
    setCompetitorsData(newCompetitors);
    return newCompetitors;
  }, [rateCalendar]);

  const calculateRateParity = useCallback(() => {
    return checkRateParity(competitorsData);
  }, [competitorsData]);

  const detectUnderpricing = useCallback(() => {
    const issues = calculateRateParity();
    return issues.filter((i: any) => i.type === 'underpriced');
  }, [calculateRateParity]);

  const detectOverpricing = useCallback(() => {
    const issues = calculateRateParity();
    return issues.filter((i: any) => i.type === 'overpriced');
  }, [calculateRateParity]);

  const competitorInsights = useMemo(() => {
    return competitorInsightsApi || getCompetitorInsights(competitorsData);
  }, [competitorsData, competitorInsightsApi]);

  const parityIssues = useMemo(() => {
    return checkRateParity(competitorsData);
  }, [competitorsData]);

  // ============================================
  // SEGMENT FUNCTIONS
  // ============================================

  const refreshSegments = useCallback(async () => {
    await loadSegments();
  }, [loadSegments]);

  const updateSegmentPerformanceData = useCallback(() => {
    const newPerformance = generateSegmentPerformance();
    setLocalSegmentPerformance(newPerformance);
    return newPerformance;
  }, []);

  const calculateSegmentADR = useCallback((segmentId: string) => {
    const segment = segmentPerformance.find(s => s.segmentId === segmentId);
    if (segment) return segment.adr;
    return localSegmentPerformance[segmentId]?.ytd?.adr || 0;
  }, [segmentPerformance, localSegmentPerformance]);

  const calculateSegmentContribution = useCallback((segmentId: string) => {
    const segment = segmentPerformance.find(s => s.segmentId === segmentId);
    if (segment) return segment.revenueContribution;
    return localSegmentPerformance[segmentId]?.metrics?.revenueContribution || 0;
  }, [segmentPerformance, localSegmentPerformance]);

  const segmentComparison = useMemo(() => {
    if (segmentPerformance.length > 0) {
      return segmentPerformance.map(s => ({
        segmentId: s.segmentId,
        segmentName: s.segmentName,
        revenue: s.revenue,
        adr: s.adr,
        occupancy: s.occupancy,
        contribution: s.revenueContribution,
        trend: s.trend,
      }));
    }
    return getSegmentComparison(localSegmentPerformance);
  }, [segmentPerformance, localSegmentPerformance]);

  // ============================================
  // KPI FUNCTIONS
  // ============================================

  const refreshKPIs = useCallback(async () => {
    await loadKPIs();
  }, [loadKPIs]);

  // ============================================
  // EVENT FUNCTIONS
  // ============================================

  const refreshEvents = useCallback(async () => {
    await loadEvents();
  }, [loadEvents]);

  // ============================================
  // AI RECOMMENDATIONS
  // ============================================

  const applyRecommendation = useCallback(async (recommendation: PricingRecommendation) => {
    const recId = `${recommendation.date}_${recommendation.room_type_id}`;

    // Optimistic update - remove from list
    const oldRecommendations = [...recommendations];
    setRecommendations(prev => prev.filter(r =>
      !(r.date === recommendation.date && r.room_type_id === recommendation.room_type_id)
    ));

    try {
      await revenueIntelligenceService.acceptRecommendation(recId);

      // Apply the rate change
      await updateRate(
        recommendation.room_type_id.toString(),
        recommendation.date,
        recommendation.recommended_rate,
        `AI Recommendation: ${recommendation.reasoning}`
      );
    } catch (err) {
      console.error('Failed to apply recommendation:', err);
      // Rollback on error
      setRecommendations(oldRecommendations);
      throw err;
    }
  }, [recommendations, updateRate]);

  const dismissRecommendation = useCallback(async (id: string) => {
    const [date, roomTypeId] = id.split('_');

    // Optimistic update
    const oldRecommendations = [...recommendations];
    setRecommendations(prev => prev.filter(r =>
      !(r.date === date && r.room_type_id.toString() === roomTypeId)
    ));

    try {
      await revenueIntelligenceService.dismissRecommendation(id);
    } catch (err) {
      console.error('Failed to dismiss recommendation:', err);
      // Rollback on error
      setRecommendations(oldRecommendations);
      throw err;
    }
  }, [recommendations]);

  const generateRecommendations = useCallback(async () => {
    try {
      const response = await revenueIntelligenceService.getPricingRecommendations();
      setRecommendations(response.recommendations);
      return response.recommendations;
    } catch (err) {
      console.error('Failed to generate recommendations:', err);
      return [];
    }
  }, []);

  const refreshRecommendations = useCallback(async () => {
    await loadRecommendations();
  }, [loadRecommendations]);

  const applyAllRecommendations = useCallback(async () => {
    setIsSyncing(true);
    try {
      await revenueIntelligenceService.applyAllRecommendations();

      // Apply all rates locally
      const updates = recommendations.map(r => ({
        roomTypeId: r.room_type_id.toString(),
        date: r.date,
        rate: r.recommended_rate,
      }));
      await bulkUpdateRates(updates);

      // Clear recommendations
      setRecommendations([]);
    } catch (err) {
      console.error('Failed to apply all recommendations:', err);
      throw err;
    } finally {
      setIsSyncing(false);
    }
  }, [recommendations, bulkUpdateRates]);

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const ruleAnalytics = useMemo(() => {
    return getRuleAnalytics(rules);
  }, [rules]);

  const value: RMSContextType = {
    // State
    rateCalendar,
    rules,
    forecast,
    pickup,
    competitors: competitorsData,
    segmentPerformance,
    recommendations,
    events,
    kpis,
    lastRecalculation,
    isLoading,
    isSyncing,
    error,

    // Static data
    roomTypes,
    rateCodes,
    segments,

    // Undo/Redo
    undo,
    redo,
    clearHistory,
    canUndo,
    canRedo,
    history,
    historyIndex,
    lastAction,

    // Rate Calendar functions
    getRateForDate,
    updateRate,
    bulkUpdateRates,
    applyRestriction,
    applyPromotion,

    // Dynamic Pricing
    calculateDynamicRate,

    // Rules Engine
    applyRulesForDate,
    runAllRules,
    addRule,
    updateRule: updateRuleData,
    deleteRule,
    toggleRule,
    refreshRules,

    // Forecast
    refreshForecast,
    runForecast,
    simulateDemandSurge,
    simulateDemandDrop,
    forecastSummary,
    forecastInsights,
    highImpactDays,
    opportunityDays,

    // Pickup
    refreshPickup,
    updatePickup,
    calculatePickupByDate,
    compareToHistorical,
    predictPickup,
    pickupMetrics,

    // Competitors
    refreshCompetitors,
    updateCompetitorRates,
    calculateRateParity,
    detectUnderpricing,
    detectOverpricing,
    competitorInsights,
    parityIssues,

    // Segments
    refreshSegments,
    updateSegmentPerformance: updateSegmentPerformanceData,
    calculateSegmentADR,
    calculateSegmentContribution,
    segmentComparison,

    // KPIs
    refreshKPIs,

    // Events
    refreshEvents,

    // Rules Analytics
    ruleAnalytics,

    // AI Recommendations
    applyRecommendation,
    dismissRecommendation,
    generateRecommendations,
    refreshRecommendations,
    applyAllRecommendations,

    // Refresh All
    refreshAll,
  };

  return (
    <RMSContext.Provider value={value}>
      {children}
    </RMSContext.Provider>
  );
}

export default RMSContext;
