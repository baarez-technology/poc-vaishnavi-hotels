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
  operator?: string; // Backend requires operator for some condition types
}

export interface PricingRuleAction {
  type: string;
  value: number | boolean;
}

// Backend condition types and operators (API expects these enums and operator required)
const BACKEND_CONDITION_TYPES = ['demand_level', 'occupancy', 'day_of_week', 'lead_time'] as const;
const BACKEND_OPERATORS = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'in'] as const;

// Transform frontend condition type to backend format
const transformConditionToBackend = (condition: PricingRuleCondition): any => {
  const { type, value } = condition;
  const op = condition.operator;

  // Map frontend condition types to backend format
  // Backend expects: 'demand_level', 'occupancy', 'day_of_week', 'lead_time' and operator required

  if (type === 'occupancy_above') {
    return { type: 'occupancy', operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'gte', value };
  }
  if (type === 'occupancy_below') {
    return { type: 'occupancy', operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'lte', value };
  }
  if (type === 'pickup_above' || type === 'pickup_below') {
    return { type: 'lead_time', operator: type === 'pickup_above' ? 'gte' : 'lte', value };
  }
  if (type === 'days_to_arrival') {
    return { type: 'lead_time', operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'gte', value };
  }
  if (type === 'day_of_week') {
    return { type: 'day_of_week', operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'eq', value };
  }
  if (type === 'demand_level') {
    return { type: 'demand_level', operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'eq', value };
  }
  if (type === 'competitor_higher' || type === 'competitor_lower') {
    return { type: 'demand_level', operator: 'eq', value: type === 'competitor_higher' ? 'high' : 'low' };
  }
  if (type === 'event_active') {
    return { type: 'demand_level', operator: 'eq', value: value ? 'high' : 'low' };
  }
  // API returns rules with condition types like event_type; map to supported type when editing
  if (type === 'event_type') {
    const demandValue = typeof value === 'string' && ['high', 'critical', 'moderate', 'low', 'very_low'].includes(value)
      ? value
      : 'high';
    return { type: 'demand_level', operator: 'eq', value: demandValue };
  }

  // Already in backend format: ensure type is allowed and operator is present
  if (BACKEND_CONDITION_TYPES.includes(type as any)) {
    return {
      type,
      operator: op && BACKEND_OPERATORS.includes(op as any) ? op : 'eq',
      value,
    };
  }

  // Unknown type (e.g. from API response): map to demand_level so update doesn't 422
  return { type: 'demand_level', operator: 'eq', value: 'high' };
};

// Backend action types (API only accepts these)
const BACKEND_ACTION_TYPES = ['adjust_percent', 'set_rate', 'multiply_by'] as const;

// Transform frontend action type to backend format. Returns null for unsupported types (e.g. apply_min_stay).
const transformActionToBackend = (action: PricingRuleAction): any => {
  const { type, value } = action;

  // Backend expects: 'adjust_percent', 'set_rate', 'multiply_by'

  if (type === 'increase_percent') {
    return { type: 'adjust_percent', value: Math.abs(Number(value)) };
  }
  if (type === 'decrease_percent') {
    return { type: 'adjust_percent', value: -Math.abs(Number(value)) };
  }
  if (type === 'set_rate') {
    return { type: 'set_rate', value: Number(value) };
  }
  if (type === 'set_min_rate' || type === 'set_max_rate') {
    return { type: 'set_rate', value: Number(value) };
  }
  if (type === 'multiply_by') {
    return { type: 'multiply_by', value: Number(value) };
  }

  // Already in backend format and supported
  if (BACKEND_ACTION_TYPES.includes(type as any)) {
    return { type, value: Number(value) };
  }

  // Unsupported (e.g. apply_min_stay from API response): omit so update doesn't 422
  return null;
};

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
  timesTriggered?: number;
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

// Room Type for RMS
export interface RMSRoomType {
  id: string;
  name: string;
  baseRate: number;
  maxOccupancy: number;
  category: string;
  slug: string;
  dbId: number;
}

export interface RMSRoomTypesResponse {
  roomTypes: RMSRoomType[];
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
  is_weekend?: boolean;
  pace_ratio?: number;
}

export interface PickupAIInsight {
  type: 'warning' | 'opportunity' | 'info';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
}

export interface PickupMetricsResponse {
  next_days: number;
  pickup_data: PickupData[];
  summary: {
    strong_pace_days: number;
    critical_pace_days: number;
    on_pace_days?: number;
    total_remaining_rooms: number;
    total_booked?: number;
    avg_occupancy: number;
    avg_pace_ratio?: number;
  };
  ai_insights?: PickupAIInsight[];
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

// Legacy DashboardData type for backward compatibility with RevenueDashboard component
export interface DashboardSummary {
  total_revenue_7d: number;
  total_revenue_30d: number;
  revenue_trend: number;
  avg_occupancy: number;
  occupancy_trend: number;
  avg_adr: number;
  adr_trend: number;
}

export interface SegmentData {
  segment_name: string;
  revenue_contribution: number;
  color?: string;
}

export interface CompetitorInsights {
  avg_gap_percent: number;
  underpriced_days: number;
  overpriced_days: number;
  potential_revenue_loss?: number;
}

export interface PickupSummary {
  strong_days: number;
  critical_days: number;
  total_remaining: number;
}

export interface Recommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  potential_revenue: number;
  title?: string;
  description?: string;
}

export interface DashboardData {
  summary: DashboardSummary;
  forecast_data: ForecastItem[];
  high_impact_days: ForecastItem[];
  segment_data: SegmentData[];
  competitor_insights: CompetitorInsights;
  pickup_summary: PickupSummary;
}

// ==================== API SERVICE ====================

const BASE_URL = '/api/v1/revenue-intelligence';

/**
 * Transform API rule response to frontend format
 * Handles both camelCase and snake_case field names
 */
const transformRuleResponse = (rule: any): PricingRule => {
  return {
    id: rule.id,
    name: rule.name || rule.rule_name || 'Unnamed Rule',
    description: rule.description || '',
    priority: rule.priority || 1,
    isActive: rule.isActive ?? rule.is_active ?? true,
    roomTypes: rule.roomTypes || rule.room_types || [],
    conditions: rule.conditions || [],
    actions: rule.actions || [],
    createdAt: rule.createdAt || rule.created_at || new Date().toISOString(),
    updatedAt: rule.updatedAt || rule.updated_at || new Date().toISOString(),
    lastTriggered: rule.lastTriggered || rule.last_triggered || rule.lastTriggeredAt || rule.last_triggered_at,
    timesTriggered: rule.timesTriggered ?? rule.times_triggered ?? 0,
    executionStatus: rule.executionStatus || rule.execution_status,
    lastExecutionMessage: rule.lastExecutionMessage || rule.last_execution_message,
  };
};

function toBackendCreatePayload(rule: CreatePricingRuleRequest): BackendPricingRuleCreate {
  const roomTypeId = rule.roomTypes?.length
    ? (() => {
        const n = parseInt(String(rule.roomTypes[0]), 10);
        return Number.isNaN(n) ? null : n;
      })()
    : null;
  const actions = (rule.actions || [])
    .map(transformActionToBackend)
    .filter((a): a is NonNullable<typeof a> => a != null);
  return {
    rule_name: rule.name,
    description: rule.description,
    room_type_id: roomTypeId,
    priority: rule.priority,
    is_active: rule.isActive,
    conditions: (rule.conditions || []).map(transformConditionToBackend),
    actions,
  };
}

function toBackendUpdatePayload(rule: UpdatePricingRuleRequest): BackendPricingRuleUpdate {
  const out: BackendPricingRuleUpdate = {};
  if (rule.name !== undefined) out.rule_name = rule.name;
  if (rule.description !== undefined) out.description = rule.description;
  if (rule.roomTypes !== undefined) {
    out.room_type_id = rule.roomTypes?.length
      ? (() => {
          const n = parseInt(String(rule.roomTypes![0]), 10);
          return Number.isNaN(n) ? null : n;
        })()
      : null;
  }
  if (rule.priority !== undefined) out.priority = rule.priority;
  if (rule.isActive !== undefined) out.is_active = rule.isActive;
  if (rule.conditions !== undefined) out.conditions = rule.conditions.map(transformConditionToBackend);
  if (rule.actions !== undefined) {
    out.actions = rule.actions.map(transformActionToBackend).filter((a): a is NonNullable<typeof a> => a != null);
  }
  return out;
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
   * Get room types for RMS
   * Cached for 5 minutes since room types rarely change
   */
  async getRoomTypes(): Promise<RMSRoomTypesResponse> {
    return requestCache.get('rms-room-types', async () => {
      const response = await apiClient.get<RMSRoomTypesResponse>(`${BASE_URL}/room-types`);
      return response.data;
    }, 300000); // 5 minute cache
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
   * Cached for 30 seconds to prevent duplicate calls.
   * Pass { bypassCache: true } to force a fresh request (e.g. when user clicks Refresh).
   */
  async getPickupMetrics(days?: number, options?: { bypassCache?: boolean }): Promise<PickupMetricsResponse> {
    const cacheKey = `pickup-metrics:${days || 'default'}`;
    const fetcher = async () => {
      const response = await apiClient.get<PickupMetricsResponse>(`${BASE_URL}/metrics/pickup`, {
        params: { days },
      });
      return response.data;
    };
    if (options?.bypassCache) {
      return fetcher();
    }
    return requestCache.get(cacheKey, fetcher);
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

  /**
   * Get dashboard data in legacy format for RevenueDashboard component
   * Transforms the new API response to the expected format
   */
  async getDashboardLegacy(): Promise<DashboardData> {
    return requestCache.get('dashboard-legacy', async () => {
      // Fetch data from multiple endpoints to assemble legacy dashboard format
      const [kpiSummary, forecastRes, competitorInsights, pickupMetrics, segmentPerformance] = await Promise.all([
        this.getKPISummary().catch(() => null),
        this.getForecast().catch(() => ({ forecasts: [] })),
        this.getCompetitorInsights().catch(() => null),
        this.getPickupMetrics().catch(() => null),
        this.getSegmentPerformance().catch(() => []),
      ]);

      // Transform KPI summary to legacy summary format
      const summary: DashboardSummary = {
        total_revenue_7d: kpiSummary?.next_7_days?.total_revenue || 0,
        total_revenue_30d: kpiSummary?.next_30_days?.total_revenue || 0,
        revenue_trend: kpiSummary?.week?.revenue_trend || 0,
        avg_occupancy: kpiSummary?.week?.occupancy || 0,
        occupancy_trend: kpiSummary?.week?.occupancy_trend || 0,
        avg_adr: kpiSummary?.week?.adr || 0,
        adr_trend: kpiSummary?.week?.adr_trend || 0,
      };

      // Transform forecast data
      const forecast_data: ForecastItem[] = forecastRes?.forecasts || [];

      // Get high impact days
      const high_impact_days = forecast_data.filter(
        day => day.demand_level === 'critical' || day.demand_level === 'high'
      );

      // Transform segment data
      const segment_data: SegmentData[] = segmentPerformance?.map((seg, index) => ({
        segment_name: seg.segmentName,
        revenue_contribution: seg.revenueContribution,
        color: ['#4E5840', '#A57865', '#C9A86C', '#6B8E8E', '#9E6E78'][index % 5],
      })) || [];

      // Transform competitor insights
      const competitor_insights: CompetitorInsights = {
        avg_gap_percent: competitorInsights?.market_averages?.avg_rate
          ? Math.round(((competitorInsights.market_averages.avg_rate - (summary.avg_adr || 0)) / competitorInsights.market_averages.avg_rate) * 100)
          : 0,
        underpriced_days: 0,
        overpriced_days: 0,
        potential_revenue_loss: 0,
      };

      // Transform pickup summary
      const pickup_summary: PickupSummary = {
        strong_days: pickupMetrics?.summary?.strong_pace_days || 0,
        critical_days: pickupMetrics?.summary?.critical_pace_days || 0,
        total_remaining: pickupMetrics?.summary?.total_remaining_rooms || 0,
      };

      return {
        summary,
        forecast_data,
        high_impact_days,
        segment_data,
        competitor_insights,
        pickup_summary,
      };
    });
  },

  /**
   * Get recommendations in legacy format
   * Returns recommendations with potential_revenue field
   */
  async getRecommendations(): Promise<Recommendation[]> {
    return requestCache.get('recommendations-legacy', async () => {
      try {
        const response = await this.getPricingRecommendations();
        return (response?.recommendations || []).map((rec, index) => ({
          id: `rec-${index}`,
          priority: rec.priority,
          potential_revenue: Math.round(Math.abs(rec.change_percent) * (rec.current_rate || 100)),
          title: `Rate ${rec.change_percent > 0 ? 'Increase' : 'Decrease'} Recommended`,
          description: rec.reasoning,
        }));
      } catch {
        // Return empty array if API fails
        return [];
      }
    });
  },

  /**
   * Run all pricing rules (alias for executePricingRules)
   */
  async runAllRules(): Promise<ExecuteRulesResponse> {
    const result = await this.executePricingRules();
    // Invalidate all caches after running rules
    requestCache.invalidate();
    return result;
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
    await apiClient.post(`${BASE_URL}/pricing/recommendations/${id}/dismiss`, {});
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
   * Get all pricing rules. Normalizes backend shape (is_active, rule_name) to frontend shape (isActive, name).
   */
  async getPricingRules(): Promise<PricingRule[]> {
    const response = await apiClient.get<{ rules: Record<string, unknown>[]; total?: number; active_count?: number; activeCount?: number }>(`${BASE_URL}/pricing-rules`);
    const raw = response.data?.rules ?? response.data?.data?.rules ?? [];
    const list = Array.isArray(raw) ? raw : [];
    return list.map((r: Record<string, unknown>) => transformRuleResponse(r));
  },

  /**
   * Create a new pricing rule.
   * Backend expects: rule_name (not name), snake_case fields, and specific condition/action types.
   */
  async createPricingRule(rule: CreatePricingRuleRequest): Promise<PricingRule> {
    const payload = toBackendCreatePayload(rule);
    const response = await apiClient.post<Record<string, unknown>>(`${BASE_URL}/pricing-rules`, payload);
    return transformRuleResponse(response.data ?? {});
  },

  /**
   * Update an existing pricing rule.
   * Backend expects: rule_name (not name), snake_case fields, and specific condition/action types.
   */
  async updatePricingRule(id: number, rule: UpdatePricingRuleRequest): Promise<PricingRule> {
    const payload = toBackendUpdatePayload(rule);
    const response = await apiClient.put<Record<string, unknown>>(
      `${BASE_URL}/pricing-rules/${id}`,
      payload
    );
    return transformRuleResponse(response.data ?? {});
  },

  /**
   * Delete a pricing rule
   */
  async deletePricingRule(id: number | string): Promise<void> {
    const ruleId = typeof id === 'number' ? id : parseInt(String(id), 10);
    if (Number.isNaN(ruleId)) throw new Error('Invalid rule id');
    await apiClient.delete(`${BASE_URL}/pricing-rules/${ruleId}`);
  },

  /**
   * Toggle a pricing rule active/inactive. Returns the new state so UI can update immediately.
   */
  async togglePricingRule(id: number): Promise<{ is_active: boolean }> {
    const response = await apiClient.patch<{ is_active?: boolean; isActive?: boolean; data?: { is_active?: boolean } }>(
      `${BASE_URL}/pricing-rules/${id}/toggle`
    );
    const body = response.data ?? {};
    const data = (body as any).data ?? body;
    const is_active = data.is_active ?? data.isActive ?? (body as any).is_active ?? (body as any).isActive ?? false;
    return { is_active: Boolean(is_active) };
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
