/**
 * Reputation AI Service
 * Provides access to reputation dashboard, analytics, reviews, and AI response generation
 */
import { apiClient as api } from '../client';

// Types
export interface ReputationMetrics {
  total_reviews: number;
  average_rating: number;
  response_rate: number;
  nps_score: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface SourceBreakdown {
  source: string;
  count: number;
  average_rating: number;
  response_rate: number;
}

export interface Review {
  id: number;
  guest_name: string;
  guest_email?: string;
  source: string;
  rating: number;
  title?: string;
  content: string;
  sentiment_score: number;
  sentiment_label: string;
  keywords: string[];
  created_at: string;
  responded: boolean;
  response_text?: string;
  response_date?: string;
}

export interface ReputationDashboard {
  metrics: ReputationMetrics;
  source_breakdown: SourceBreakdown[];
  recent_reviews: Review[];
  rating_trend: Array<{ date: string; rating: number; count: number }>;
  sentiment_trend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  pending_responses: number;
  goals: Array<{
    id: number;
    metric_type: string;
    target_value: number;
    current_value: number;
    progress: number;
    status: string;
  }>;
}

export interface ReviewAnalytics {
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_keywords: Array<{ keyword: string; count: number; sentiment: string }>;
  source_performance: SourceBreakdown[];
  period: { start: string; end: string };
}

export interface TrendData {
  current_period: {
    avg_rating: number;
    avg_sentiment: number;
    review_count: number;
  };
  previous_period: {
    avg_rating: number;
    avg_sentiment: number;
    review_count: number;
  };
  rating_trend: string;
  rating_change: number;
  sentiment_trend: string;
  sentiment_change: number;
  volume_trend: string;
  volume_change: number;
}

export interface ResponseDraft {
  id: number;
  review_id: number;
  draft_text: string;
  tone: string;
  generated_at: string;
  status: string;
}

export interface CompetitorBenchmark {
  competitor_name: string;
  avg_rating: number;
  review_count: number;
  response_rate: number;
  sentiment_score: number;
}

// API Service
class ReputationService {
  private baseUrl = '/api/v1/reputation';

  // Dashboard
  async getDashboard(): Promise<ReputationDashboard> {
    const response = await api.get(`${this.baseUrl}/dashboard`);
    return response.data.data || response.data;
  }

  // Analytics
  async getAnalytics(
    source?: string,
    startDate?: string,
    endDate?: string
  ): Promise<ReviewAnalytics> {
    const params: Record<string, string> = {};
    if (source) params.source = source;
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await api.get(`${this.baseUrl}/analytics`, { params });
    return response.data.data || response.data;
  }

  // Trends
  async getTrends(days: number = 14): Promise<TrendData> {
    const response = await api.get(`${this.baseUrl}/trends`, {
      params: { days }
    });
    return response.data.data || response.data;
  }

  // Reviews needing response
  async getPendingReviews(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{ reviews: Review[]; total: number; page: number }> {
    const response = await api.get(`${this.baseUrl}/reviews/pending`, {
      params: { page, page_size: pageSize }
    });
    return response.data.data || response.data;
  }

  // Generate AI response draft
  async generateResponseDraft(
    reviewId: number,
    tone: string = 'professional',
    includeResolution: boolean = false
  ): Promise<ResponseDraft> {
    const response = await api.post(`${this.baseUrl}/reviews/${reviewId}/generate-draft`, {
      tone,
      include_resolution: includeResolution
    });
    return response.data.data || response.data;
  }

  // Approve and publish response
  async approveResponse(
    draftId: number,
    finalText?: string
  ): Promise<{ success: boolean; review_id: number }> {
    const response = await api.post(`${this.baseUrl}/drafts/${draftId}/approve`, {
      final_text: finalText
    });
    return response.data.data || response.data;
  }

  // Competitor benchmarks
  async getCompetitorBenchmarks(): Promise<{ competitors: CompetitorBenchmark[] }> {
    const response = await api.get(`${this.baseUrl}/competitors`);
    return response.data.data || response.data;
  }

  // Create performance goal
  async createGoal(
    metricType: string,
    targetValue: number,
    startDate: string,
    endDate: string
  ): Promise<any> {
    const response = await api.post(`${this.baseUrl}/goals`, {
      metric_type: metricType,
      target_value: targetValue,
      start_date: startDate,
      end_date: endDate
    });
    return response.data.data || response.data;
  }

  // Update goal progress
  async updateGoalProgress(goalId: number): Promise<any> {
    const response = await api.patch(`${this.baseUrl}/goals/${goalId}/progress`);
    return response.data.data || response.data;
  }

  // Summary stats
  async getSummaryStats(): Promise<{
    total_reviews: number;
    average_rating: number;
    response_rate: number;
    nps_score: number;
    pending_responses: number;
    sentiment: { positive: number; neutral: number; negative: number };
  }> {
    const response = await api.get(`${this.baseUrl}/stats/summary`);
    return response.data.data || response.data;
  }
}

export const reputationService = new ReputationService();
export default reputationService;
