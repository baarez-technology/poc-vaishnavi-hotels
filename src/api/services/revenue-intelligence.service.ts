/**
 * Revenue Intelligence API Service
 *
 * Provides AI-powered revenue management, forecasting, and pricing optimization
 */

import { apiClient } from '../client';

// ==================== TYPES ====================

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
   */
  async getKPISummary(): Promise<KPISummary> {
    const response = await apiClient.get<KPISummary>(`${BASE_URL}/kpis/summary`);
    return response.data;
  },

  /**
   * Get demand forecast
   */
  async getForecast(params?: {
    start_date?: string;
    end_date?: string;
    room_type_id?: number;
  }): Promise<ForecastResponse> {
    const response = await apiClient.get<ForecastResponse>(`${BASE_URL}/forecast`, { params });
    return response.data;
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
   */
  async getPricingRecommendations(params?: {
    start_date?: string;
    end_date?: string;
    room_type_id?: number;
    priority?: string;
  }): Promise<PricingRecommendationsResponse> {
    const response = await apiClient.get<PricingRecommendationsResponse>(
      `${BASE_URL}/pricing/recommendations`,
      { params }
    );
    return response.data;
  },

  /**
   * Get revenue opportunities
   */
  async getOpportunities(limit?: number): Promise<OpportunitiesResponse> {
    const response = await apiClient.get<OpportunitiesResponse>(`${BASE_URL}/opportunities`, {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get revenue alerts
   */
  async getAlerts(severity?: string): Promise<AlertsResponse> {
    const response = await apiClient.get<AlertsResponse>(`${BASE_URL}/alerts`, {
      params: { severity },
    });
    return response.data;
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
  async getChannelAnalysis(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ChannelAnalysisResponse> {
    const response = await apiClient.get<ChannelAnalysisResponse>(`${BASE_URL}/channels`, {
      params,
    });
    return response.data;
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
   */
  async getPickupMetrics(days?: number): Promise<PickupMetricsResponse> {
    const response = await apiClient.get<PickupMetricsResponse>(`${BASE_URL}/metrics/pickup`, {
      params: { days },
    });
    return response.data;
  },

  /**
   * Get complete dashboard data
   */
  async getDashboard(): Promise<DashboardResponse> {
    const response = await apiClient.get<DashboardResponse>(`${BASE_URL}/dashboard`);
    return response.data;
  },
};

export default revenueIntelligenceService;
