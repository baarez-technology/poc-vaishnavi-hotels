/**
 * Revenue Intelligence API Service
 *
 * Provides AI-powered revenue management, forecasting, and pricing optimization
 */

import { apiClient } from '../client';

// ==================== REQUEST CACHE ====================
// Prevents duplicate API calls when multiple components request the same data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class RequestCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private defaultTTL = 30000; // 30 seconds cache TTL

  private getCacheKey(method: string, params?: any): string {
    return `${method}:${params ? JSON.stringify(params) : ''}`;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const cacheKey = key;
    const now = Date.now();

    // Check if we have a valid cached response
    const cached = this.cache.get(cacheKey);
    if (cached && now - cached.timestamp < ttl) {
      return cached.data;
    }

    // Check if there's already a pending request for this key
    const pending = this.pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    // Make the request and cache it
    const promise = fetcher()
      .then((data) => {
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(cacheKey);
        throw error;
      });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  invalidate(keyPattern?: string): void {
    if (!keyPattern) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const requestCache = new RequestCache();

// ==================== TYPES ====================

// Rate Calendar Types
export interface RateCalendarRoom {
  roomTypeId: number;
  roomTypeName: string;
  baseRate: number;
  dynamicRate: number;
  minRate: number;
  maxRate: number;
  occupancy: number;
  available: number;
  restrictions: {
    minStay?: number;
    maxStay?: number;
    cta?: boolean;
    ctd?: boolean;
    stopSell?: boolean;
  };
}

export interface RateCalendarDay {
  date: string;
  dayOfWeek: string;
  isWeekend: boolean;
  event?: string;
  demandLevel: 'critical' | 'high' | 'moderate' | 'low' | 'very_low';
  occupancy: number;
  rooms: Record<string, RateCalendarRoom>;
}

export interface RateCalendarData {
  startDate: string;
  endDate: string;
  days: RateCalendarDay[];
}

// Pricing Rules Types
export interface PricingRuleCondition {
  type: string;
  value: number | string | boolean | { min: number; max: number } | string[];
}

export interface PricingRuleAction {
  type: string;
  value: number | boolean;
}

export interface PricingRule {
  id: number;
  name: string;
  description: string;
  priority: number;
  isActive: boolean;
  roomTypes: string[];
  conditions: PricingRuleCondition[];
  actions: PricingRuleAction[];
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
  timesTriggered: number;
}

export interface CreatePricingRuleRequest {
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  roomTypes: string[];
  conditions: PricingRuleCondition[];
  actions: PricingRuleAction[];
}

export interface UpdatePricingRuleRequest {
  name?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  roomTypes?: string[];
  conditions?: PricingRuleCondition[];
  actions?: PricingRuleAction[];
}

/** Backend API expects snake_case and specific condition/action schema */
interface BackendPricingRuleCondition {
  type: string;
  operator: string;
  value: unknown;
}

interface BackendPricingRuleAction {
  type: string;
  value: number;
}

interface BackendPricingRuleCreate {
  rule_name: string;
  description?: string;
  room_type_id: number | null;
  priority: number;
  is_active: boolean;
  conditions: BackendPricingRuleCondition[];
  actions: BackendPricingRuleAction[];
}

interface BackendPricingRuleUpdate {
  rule_name?: string;
  description?: string;
  room_type_id?: number | null;
  priority?: number;
  is_active?: boolean;
  conditions?: BackendPricingRuleCondition[];
  actions?: BackendPricingRuleAction[];
}

export interface ExecuteRulesResponse {
  executedAt: string;
  rulesEvaluated: number;
  rulesTriggered: number;
  ratesUpdated: number;
  results: Array<{
    ruleId: number;
    ruleName: string;
    triggered: boolean;
    ratesAffected: number;
  }>;
}

// Auto Pricing Settings Types
export interface AutoPricingSettings {
  enabled: boolean;
  minRateThreshold: number;
  maxRateThreshold: number;
  demandBasedPricing: boolean;
  competitorTracking: boolean;
  seasonalAdjustments: boolean;
  lastUpdated: string;
}

// Competitor Types
export interface Competitor {
  id: number;
  name: string;
  rating: number;
  distance: string;
  url?: string;
  todayRate: number;
  avgRate7Day: number;
  avgRate30Day: number;
  lastUpdated: string;
  isActive: boolean;
}

export interface CreateCompetitorRequest {
  name: string;
  rating?: number;
  distance?: string;
  url?: string;
}

export interface CompetitorRateHistory {
  competitorId: number;
  competitorName: string;
  history: Array<{
    date: string;
    rate: number;
  }>;
}

// AI Insights Types
export interface AIInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low' | 'Positive';
  impactColor: 'green' | 'amber' | 'primary';
  action: string;
  actionUrl?: string;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AIInsightsResponse {
  insights: AIInsight[];
  stats: {
    forecastAccuracy: number;
    revenueOptimized: number;
    insightsGenerated: number;
  };
}

// Segment Performance Types
export interface SegmentPerformance {
  segmentId: string;
  segmentName: string;
  revenue: number;
  bookings: number;
  adr: number;
  occupancy: number;
  revenueContribution: number;
  trend: number;
}

// Event Types
export interface Event {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  type: 'local' | 'regional' | 'national' | 'international';
  expectedImpact: 'high' | 'medium' | 'low';
  description?: string;
}

export interface CreateEventRequest {
  name: string;
  startDate: string;
  endDate: string;
  type: 'local' | 'regional' | 'national' | 'international';
  expectedImpact: 'high' | 'medium' | 'low';
  description?: string;
}

export interface EventImpact {
  eventId: number;
  eventName: string;
  bookingsIncrease: number;
  revenueIncrease: number;
  occupancyIncrease: number;
  rateIncrease: number;
}

export interface KPIMetrics {
  total_revenue: number;
  revenue_trend: number;
  occupancy: number;
  occupancy_trend: number;
  adr: number;
  adr_trend: number;
  revpar: number;
  revpar_trend: number;
  total_bookings: number;
  available_room_nights: number;
  occupied_room_nights: number;
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export interface KPISummary {
  today: KPIMetrics & { label: string };
  week: KPIMetrics & { label: string };
  month: KPIMetrics & { label: string };
  next_7_days: KPIMetrics & { label: string };
  next_30_days: KPIMetrics & { label: string };
}

export interface ForecastItem {
  date: string;
  forecasted_demand: number;
  forecasted_occupancy: number;
  confidence_level: number;
  day_of_week: string;
  is_weekend: boolean;
  demand_level: 'critical' | 'high' | 'moderate' | 'low' | 'very_low';
}

export interface ForecastResponse {
  forecasts: ForecastItem[];
  generated_at: string;
}

export interface PricingRecommendation {
  date: string;
  room_type_id: number;
  room_type_name: string;
  current_rate: number;
  recommended_rate: number;
  change_percent: number;
  demand_level: string;
  forecasted_occupancy: number;
  competitor_avg: number;
  confidence: number;
  reasoning: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface PricingRecommendationsResponse {
  recommendations: PricingRecommendation[];
  total_opportunity: number;
  generated_at: string;
}

export interface RevenueOpportunity {
  type: string;
  title: string;
  description: string;
  revenue_impact: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  date?: string;
  confidence: number;
}

export interface OpportunitiesResponse {
  opportunities: RevenueOpportunity[];
  total_opportunity: number;
  generated_at: string;
}

export interface RevenueAlert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  date?: string;
  created_at: string;
}

export interface AlertsResponse {
  alerts: RevenueAlert[];
  critical_count: number;
  warning_count: number;
}

export interface ScenarioRequest {
  scenario_type: 'rate_increase' | 'rate_decrease' | 'promotion';
  parameters: {
    percentage?: number;
    discount?: number;
    demand_lift?: number;
  };
}

export interface ScenarioResponse {
  scenario_type: string;
  parameters: Record<string, unknown>;
  baseline: {
    revenue: number;
    occupancy: number;
    adr: number;
  };
  projected: {
    revenue: number;
    revenue_change: number;
    revenue_change_percent: number;
  };
  recommendation: string;
  confidence: number;
  simulated_at: string;
}

export interface ChannelPerformance {
  channel: string;
  total_bookings: number;
  total_revenue: number;
  total_commission: number;
  net_revenue: number;
  commission_rate: number;
  cancellation_rate: number;
  avg_booking_value: number;
  revenue_share: number;
  booking_share: number;
}

export interface ChannelAnalysisResponse {
  period: {
    start: string;
    end: string;
  };
  channels: ChannelPerformance[];
  totals: {
    revenue: number;
    bookings: number;
  };
  recommendations: Array<{
    channel: string;
    type: string;
    message: string;
  }>;
}

export interface PickupData {
  date: string;
  day_of_week: string;
  days_to_arrival: number;
  booked: number;
  remaining: number;
  occupancy: number;
  expected_occupancy: number;
  pace: 'strong' | 'on_pace' | 'critical';
}

export interface PickupMetricsResponse {
  next_days: number;
  pickup_data: PickupData[];
  summary: {
    strong_pace_days: number;
    critical_pace_days: number;
    total_remaining_rooms: number;
    avg_occupancy: number;
  };
}

export interface CompetitorInsight {
  competitor: string;
  avg_rate: number;
  avg_occupancy: number;
  data_points: number;
}

export interface CompetitorInsightsResponse {
  period: {
    start: string;
    end: string;
  };
  competitors: CompetitorInsight[];
  market_averages: {
    avg_rate: number;
    avg_occupancy: number;
  };
  positioning_recommendation: string;
}

export interface DashboardResponse {
  kpis: KPISummary;
  forecast: ForecastItem[];
  high_impact_days: ForecastItem[];
  recommendations: PricingRecommendation[];
  opportunities: RevenueOpportunity[];
  alerts: RevenueAlert[];
  channels: ChannelAnalysisResponse;
  generated_at: string;
}

// ==================== API SERVICE ====================

const BASE_URL = '/api/v1/revenue-intelligence';

// Backend condition types: demand_level, occupancy, day_of_week, lead_time
// Backend action types: adjust_percent, set_rate, multiply_by
const CONDITION_TO_BACKEND: Record<string, { type: string; operator: string }> = {
  occupancy_above: { type: 'occupancy', operator: 'gte' },
  occupancy_below: { type: 'occupancy', operator: 'lt' },
  pickup_above: { type: 'occupancy', operator: 'gte' },
  pickup_below: { type: 'occupancy', operator: 'lt' },
  competitor_higher: { type: 'demand_level', operator: 'eq' },
  competitor_lower: { type: 'demand_level', operator: 'eq' },
  days_to_arrival: { type: 'lead_time', operator: 'lte' },
  day_of_week: { type: 'day_of_week', operator: 'in' },
  demand_level: { type: 'demand_level', operator: 'eq' },
  event_active: { type: 'demand_level', operator: 'eq' },
};

const ACTION_TO_BACKEND: Record<string, string> = {
  increase_percent: 'adjust_percent',
  decrease_percent: 'adjust_percent',
  set_rate: 'set_rate',
  set_min_rate: 'set_rate',
  set_max_rate: 'set_rate',
  apply_min_stay: 'multiply_by',
  apply_cta: 'multiply_by',
  apply_ctd: 'multiply_by',
  apply_stop_sell: 'multiply_by',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_TO_NUM: Record<string, number> = { Sun: 6, Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5 };

function toBackendCondition(c: PricingRuleCondition): BackendPricingRuleCondition {
  const mapping = CONDITION_TO_BACKEND[c.type] ?? { type: 'demand_level', operator: 'eq' };
  let value: unknown = c.value;
  if (c.type === 'day_of_week' && Array.isArray(c.value)) {
    value = (c.value as string[]).map((d) => DAY_TO_NUM[d] ?? 0);
  }
  if (c.type === 'days_to_arrival' && typeof c.value === 'object' && c.value !== null && 'min' in (c.value as object)) {
    const range = c.value as { min?: number; max?: number };
    value = range.min ?? range.max ?? 0;
  }
  if (mapping.type === 'demand_level' && (c.type === 'competitor_higher' || c.type === 'competitor_lower' || c.type === 'event_active')) {
    value = c.type === 'event_active' ? (c.value ? 'high' : 'low') : 'normal';
  }
  return { type: mapping.type, operator: mapping.operator, value };
}

function toBackendAction(a: PricingRuleAction): BackendPricingRuleAction {
  const backendType = ACTION_TO_BACKEND[a.type] ?? 'adjust_percent';
  let num = Number(a.value);
  if (Number.isNaN(num)) num = 0;
  if (a.type === 'decrease_percent') num = -Math.abs(num);
  if (a.type === 'increase_percent') num = Math.abs(num);
  if (backendType === 'multiply_by' && !['set_rate', 'set_min_rate', 'set_max_rate'].includes(a.type)) num = 1;
  return { type: backendType, value: num };
}

function toBackendCreatePayload(rule: CreatePricingRuleRequest): BackendPricingRuleCreate {
  const room_type_id =
    !rule.roomTypes?.length || rule.roomTypes[0] === 'ALL' ? null : (parseInt(rule.roomTypes[0] as string, 10) || null);
  return {
    rule_name: rule.name,
    description: rule.description ?? undefined,
    room_type_id: typeof room_type_id === 'number' && !Number.isNaN(room_type_id) ? room_type_id : null,
    priority: rule.priority,
    is_active: rule.isActive,
    conditions: rule.conditions.map(toBackendCondition),
    actions: rule.actions.map(toBackendAction),
  };
}

function toBackendUpdatePayload(rule: UpdatePricingRuleRequest): BackendPricingRuleUpdate {
  const out: BackendPricingRuleUpdate = {};
  if (rule.name !== undefined) out.rule_name = rule.name;
  if (rule.description !== undefined) out.description = rule.description;
  if (rule.priority !== undefined) out.priority = rule.priority;
  if (rule.isActive !== undefined) out.is_active = rule.isActive;
  if (rule.roomTypes !== undefined) {
    const first = rule.roomTypes[0];
    out.room_type_id = !rule.roomTypes.length || first === 'ALL' ? null : (parseInt(first as string, 10) || null);
    if (out.room_type_id !== null && Number.isNaN(out.room_type_id)) out.room_type_id = null;
  }
  if (rule.conditions !== undefined) out.conditions = rule.conditions.map(toBackendCondition);
  if (rule.actions !== undefined) out.actions = rule.actions.map(toBackendAction);
  return out;
}

const NUM_TO_DAY: Record<number, string> = { 0: 'Mon', 1: 'Tue', 2: 'Wed', 3: 'Thu', 4: 'Fri', 5: 'Sat', 6: 'Sun' };

function fromBackendRule(raw: Record<string, unknown>): PricingRule {
  const id = raw.id as number;
  const rule_name = (raw.rule_name as string) ?? (raw.name as string);
  const room_type_id = raw.room_type_id as number | null | undefined;
  const roomTypes =
    room_type_id != null ? [String(room_type_id)] : ['ALL'];
  const conditions = ((raw.conditions as BackendPricingRuleCondition[]) ?? []).map((c) => {
    let value: unknown = c.value;
    if (c.type === 'day_of_week' && Array.isArray(c.value)) {
      value = (c.value as number[]).map((n) => NUM_TO_DAY[n] ?? 'Mon');
    }
    return { type: c.type, value };
  });
  const actions = ((raw.actions as BackendPricingRuleAction[]) ?? []).map((a) => ({
    type: a.type,
    value: a.value,
  }));
  return {
    id,
    name: rule_name,
    description: (raw.description as string) ?? '',
    priority: (raw.priority as number) ?? 3,
    isActive: (raw.is_active as boolean) ?? true,
    roomTypes,
    conditions,
    actions,
    createdAt: (raw.created_at as string) ?? '',
    updatedAt: (raw.updated_at as string) ?? (raw.created_at as string) ?? '',
    lastTriggered: raw.last_triggered_at as string | undefined,
    timesTriggered: (raw.times_triggered as number) ?? 0,
  };
}

export const revenueIntelligenceService = {
  /**
   * Get real-time KPIs
   */
  async getKPIs(params?: { start_date?: string; end_date?: string }): Promise<KPIMetrics> {
    const response = await apiClient.get<KPIMetrics>(`${BASE_URL}/kpis`, { params });
    return response.data;
  },

  /**
   * Get KPI summary for multiple periods
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getKPISummary(): Promise<KPISummary> {
    return requestCache.get('kpi-summary', async () => {
      const response = await apiClient.get<KPISummary>(`${BASE_URL}/kpis/summary`);
      return response.data;
    });
  },

  /**
   * Get demand forecast
   */
  /**
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getForecast(params?: {
    start_date?: string;
    end_date?: string;
    room_type_id?: number;
  }): Promise<ForecastResponse> {
    const cacheKey = `forecast:${JSON.stringify(params || {})}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<ForecastResponse>(`${BASE_URL}/forecast`, { params });
      return response.data;
    });
  },

  /**
   * Get high impact days
   */
  async getHighImpactDays(params?: {
    days?: number;
    threshold?: number;
  }): Promise<{ high_impact_days: ForecastItem[]; count: number; threshold: number }> {
    const response = await apiClient.get(`${BASE_URL}/forecast/high-impact`, { params });
    return response.data;
  },

  /**
   * Get pricing recommendations
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getPricingRecommendations(params?: {
    start_date?: string;
    end_date?: string;
    room_type_id?: number;
    priority?: string;
  }): Promise<PricingRecommendationsResponse> {
    const cacheKey = `pricing-recommendations:${JSON.stringify(params || {})}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<PricingRecommendationsResponse>(
        `${BASE_URL}/pricing/recommendations`,
        { params }
      );
      return response.data;
    });
  },

  /**
   * Get revenue opportunities
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getOpportunities(limit?: number): Promise<OpportunitiesResponse> {
    const cacheKey = `opportunities:${limit || 'all'}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<OpportunitiesResponse>(`${BASE_URL}/opportunities`, {
        params: { limit },
      });
      return response.data;
    });
  },

  /**
   * Get revenue alerts
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getAlerts(severity?: string): Promise<AlertsResponse> {
    const cacheKey = `alerts:${severity || 'all'}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<AlertsResponse>(`${BASE_URL}/alerts`, {
        params: { severity },
      });
      return response.data;
    });
  },

  /**
   * Simulate a scenario
   */
  async simulateScenario(request: ScenarioRequest): Promise<ScenarioResponse> {
    const response = await apiClient.post<ScenarioResponse>(
      `${BASE_URL}/scenarios/simulate`,
      request
    );
    return response.data;
  },

  /**
   * Get channel analysis
   */
  /**
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getChannelAnalysis(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ChannelAnalysisResponse> {
    const cacheKey = `channels:${JSON.stringify(params || {})}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<ChannelAnalysisResponse>(`${BASE_URL}/channels`, {
        params,
      });
      return response.data;
    });
  },

  /**
   * Get channel ROI analysis
   */
  async getChannelROI(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    period: { start: string; end: string };
    roi_analysis: Array<{
      channel: string;
      gross_revenue: number;
      commission_cost: number;
      net_revenue: number;
      net_margin_percent: number;
      commission_rate: number;
      roi_score: number;
    }>;
    recommendation: string;
  }> {
    const response = await apiClient.get(`${BASE_URL}/channels/roi`, { params });
    return response.data;
  },

  /**
   * Get competitor insights
   */
  async getCompetitorInsights(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<CompetitorInsightsResponse> {
    const response = await apiClient.get<CompetitorInsightsResponse>(
      `${BASE_URL}/competitor-insights`,
      { params }
    );
    return response.data;
  },

  /**
   * Get pickup metrics
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getPickupMetrics(days?: number): Promise<PickupMetricsResponse> {
    const cacheKey = `pickup-metrics:${days || 'default'}`;
    return requestCache.get(cacheKey, async () => {
      const response = await apiClient.get<PickupMetricsResponse>(`${BASE_URL}/metrics/pickup`, {
        params: { days },
      });
      return response.data;
    });
  },

  /**
   * Get complete dashboard data
   */
  /**
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getDashboard(): Promise<DashboardResponse> {
    return requestCache.get('dashboard', async () => {
      const response = await apiClient.get<DashboardResponse>(`${BASE_URL}/dashboard`);
      return response.data;
    });
  },

  // ==================== PRICING RECOMMENDATIONS ACTIONS ====================

  /**
   * Accept a pricing recommendation
   */
  async acceptRecommendation(id: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/pricing/recommendations/${id}/accept`);
    // Invalidate related caches
    requestCache.invalidate('pricing-recommendations');
    requestCache.invalidate('kpi');
    requestCache.invalidate('dashboard');
  },

  /**
   * Dismiss a pricing recommendation
   */
  async dismissRecommendation(id: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/pricing/recommendations/${id}/dismiss`);
    requestCache.invalidate('pricing-recommendations');
  },

  /**
   * Apply all pending recommendations
   */
  async applyAllRecommendations(): Promise<void> {
    await apiClient.post(`${BASE_URL}/pricing/recommendations/apply-all`);
    // Invalidate all data caches since rates are changing
    requestCache.invalidate();
  },

  /**
   * Dismiss all pending recommendations
   */
  async dismissAllRecommendations(): Promise<void> {
    await apiClient.post(`${BASE_URL}/pricing/recommendations/dismiss-all`);
    requestCache.invalidate('pricing-recommendations');
  },

  // ==================== RATE MANAGEMENT ====================

  /**
   * Update a single rate
   */
  async updateRate(
    roomTypeId: string | number,
    date: string,
    data: { rate: number; reason?: string }
  ): Promise<void> {
    await apiClient.put(`${BASE_URL}/rates/${roomTypeId}/${date}`, data);
    // Invalidate caches that depend on rate data
    requestCache.invalidate('kpi');
    requestCache.invalidate('forecast');
    requestCache.invalidate('dashboard');
    requestCache.invalidate('pricing-recommendations');
  },

  /**
   * Bulk update rates
   */
  async bulkUpdateRates(
    updates: Array<{ roomTypeId: number; date: string; rate: number }>
  ): Promise<void> {
    await apiClient.put(`${BASE_URL}/rates/bulk-update`, { updates });
    // Invalidate all data caches since multiple rates changed
    requestCache.invalidate();
  },

  /**
   * Get rate calendar for a date range
   */
  async getRateCalendar(startDate: string, endDate: string): Promise<RateCalendarData> {
    const response = await apiClient.get<RateCalendarData>(`${BASE_URL}/rates/calendar`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  // ==================== PRICING RULES ====================

  /**
   * Get all pricing rules
   */
  async getPricingRules(): Promise<PricingRule[]> {
    const response = await apiClient.get<{ rules?: PricingRule[]; data?: PricingRule[] } | PricingRule[]>(
      `${BASE_URL}/pricing-rules`
    );
    const data = response.data as Record<string, unknown> | PricingRule[];
    const list = Array.isArray(data) ? data : (data?.rules as Record<string, unknown>[] | undefined) ?? [];
    return (list as Record<string, unknown>[]).map(fromBackendRule);
  },

  /**
   * Create a new pricing rule
   */
  async createPricingRule(rule: CreatePricingRuleRequest): Promise<PricingRule> {
    const payload = toBackendCreatePayload(rule);
    const response = await apiClient.post<Record<string, unknown>>(`${BASE_URL}/pricing-rules`, payload);
    return fromBackendRule(response.data ?? {});
  },

  /**
   * Update an existing pricing rule
   */
  async updatePricingRule(id: number, rule: UpdatePricingRuleRequest): Promise<PricingRule> {
    const payload = toBackendUpdatePayload(rule);
    const response = await apiClient.put<Record<string, unknown>>(
      `${BASE_URL}/pricing-rules/${id}`,
      payload
    );
    return fromBackendRule(response.data ?? {});
  },

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/pricing-rules/${id}`);
  },

  /**
   * Toggle a pricing rule active/inactive. Returns the new state so UI can update immediately.
   */
  async togglePricingRule(id: number): Promise<{ is_active: boolean }> {
    const response = await apiClient.patch<{ is_active: boolean }>(
      `${BASE_URL}/pricing-rules/${id}/toggle`
    );
    return response.data ?? { is_active: false };
  },

  /**
   * Execute all active pricing rules
   */
  async executePricingRules(): Promise<ExecuteRulesResponse> {
    const response = await apiClient.post<ExecuteRulesResponse>(
      `${BASE_URL}/pricing-rules/execute`
    );
    return response.data;
  },

  // ==================== SETTINGS ====================

  /**
   * Get auto pricing settings
   */
  async getAutoPricingSettings(): Promise<AutoPricingSettings> {
    const response = await apiClient.get<AutoPricingSettings>(`${BASE_URL}/settings/auto-pricing`);
    return response.data;
  },

  /**
   * Update auto pricing settings
   */
  async updateAutoPricingSettings(settings: AutoPricingSettings): Promise<void> {
    await apiClient.put(`${BASE_URL}/settings/auto-pricing`, settings);
  },

  /**
   * Toggle auto pricing on/off
   */
  async toggleAutoPricing(enabled: boolean): Promise<void> {
    await apiClient.post(`${BASE_URL}/settings/auto-pricing/toggle`, { enabled });
  },

  /**
   * Toggle competitor scan on/off
   */
  async toggleCompetitorScan(enabled: boolean): Promise<void> {
    await apiClient.post(`${BASE_URL}/settings/competitor-scan/toggle`, { enabled });
  },

  /**
   * Toggle demand pricing on/off
   */
  async toggleDemandPricing(enabled: boolean): Promise<void> {
    await apiClient.post(`${BASE_URL}/settings/demand-pricing/toggle`, { enabled });
  },

  // ==================== COMPETITORS ====================

  /**
   * Get all competitors
   */
  /**
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getCompetitors(): Promise<Competitor[]> {
    return requestCache.get('competitors', async () => {
      const response = await apiClient.get<Competitor[]>(`${BASE_URL}/competitors`);
      return response.data;
    });
  },

  /**
   * Add a new competitor
   */
  async addCompetitor(competitor: CreateCompetitorRequest): Promise<Competitor> {
    const response = await apiClient.post<Competitor>(`${BASE_URL}/competitors`, competitor);
    return response.data;
  },

  /**
   * Delete a competitor
   */
  async deleteCompetitor(id: number): Promise<void> {
    await apiClient.delete(`${BASE_URL}/competitors/${id}`);
  },

  /**
   * Refresh competitor rates
   */
  async refreshCompetitorRates(): Promise<void> {
    await apiClient.post(`${BASE_URL}/competitors/refresh`);
  },

  /**
   * Get competitor rate history
   */
  async getCompetitorRateHistory(id: number, days?: number): Promise<CompetitorRateHistory> {
    const response = await apiClient.get<CompetitorRateHistory>(
      `${BASE_URL}/competitors/${id}/rates`,
      { params: { days } }
    );
    return response.data;
  },

  // ==================== AI INSIGHTS ====================

  /**
   * Get AI insights
   */
  async getAIInsights(): Promise<AIInsightsResponse> {
    const response = await apiClient.get<AIInsightsResponse>(`${BASE_URL}/ai/insights`);
    return response.data;
  },

  /**
   * Dismiss an insight
   */
  async dismissInsight(id: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/ai/insights/${id}/dismiss`);
  },

  /**
   * Mark an insight as read
   */
  async markInsightRead(id: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/ai/insights/${id}/read`);
  },

  // ==================== SEGMENTS ====================

  /**
   * Get segment performance
   */
  /**
   * Cached for 30 seconds to prevent duplicate calls
   */
  async getSegmentPerformance(): Promise<SegmentPerformance[]> {
    return requestCache.get('segments-performance', async () => {
      const response = await apiClient.get<SegmentPerformance[]>(`${BASE_URL}/segments/performance`);
      return response.data;
    });
  },

  // ==================== EVENTS ====================

  /**
   * Get events
   */
  async getEvents(startDate?: string, endDate?: string): Promise<Event[]> {
    const response = await apiClient.get<Event[]>(`${BASE_URL}/events`, {
      params: { start_date: startDate, end_date: endDate },
    });
    return response.data;
  },

  /**
   * Create an event
   */
  async createEvent(event: CreateEventRequest): Promise<Event> {
    const response = await apiClient.post<Event>(`${BASE_URL}/events`, event);
    return response.data;
  },

  /**
   * Get event impact analysis
   */
  async getEventImpact(params?: { start_date?: string; end_date?: string }): Promise<EventImpact> {
    const response = await apiClient.get<EventImpact>(`${BASE_URL}/events/impact`, { params });
    return response.data;
  },
};

/**
 * Invalidate cache entries to force fresh data on next request
 * Call this after mutations (rate updates, applying recommendations, etc.)
 * @param pattern - Optional pattern to match cache keys. If not provided, clears all cache.
 */
export const invalidateRevenueCache = (pattern?: string): void => {
  requestCache.invalidate(pattern);
};

export default revenueIntelligenceService;
