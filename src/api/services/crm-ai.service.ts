/**
 * CRM AI Service - ReConnect AI Integration
 * Provides access to guest intelligence, churn prediction, LTV, sentiment analysis, and campaign optimization
 */
import { apiClient as api } from '../client';

// Types
export interface GuestIntelligence {
  guest_id: number;
  guest_info: {
    name: string;
    email: string;
    vip_status: boolean;
    loyalty_tier: string;
  };
  scores: {
    health: {
      score: number;
      label: string;
      components: Record<string, number>;
    };
    churn: {
      probability: number;
      risk_level: string;
      is_high_risk: boolean;
      drivers: Array<{
        factor: string;
        description: string;
        risk_contribution: number;
      }>;
    };
    ltv: {
      predicted_value: number;
      historical_value: number;
      future_value: number;
      segment: string;
    };
    rebooking: {
      probability: number;
      likelihood: string;
      optimal_contact: {
        days_until_optimal_contact: number;
        timing_window: string;
        recommendation: string;
      };
    };
  };
  campaign_recommendation: {
    recommended_campaign: {
      type: string;
      priority: string;
      segment: string;
    };
    channel_recommendation: {
      primary_channel: string;
      confidence: number;
    };
    content_recommendation: {
      subject_line_suggestions: string[];
      offer_recommendations: Array<{
        type: string;
        value: string;
        description: string;
      }>;
    };
  };
  alerts: Array<{
    type: string;
    priority: string;
    message: string;
  }>;
  key_insights: string[];
  recommended_actions: Array<{
    action: string;
    priority: string;
    category: string;
  }>;
  calculated_at: string;
}

export interface DashboardStats {
  total_guests: number;
  guests_analyzed: number;
  health_distribution: {
    excellent: number;
    good: number;
    fair: number;
    at_risk: number;
    critical: number;
  };
  average_health_score: number;
  average_churn_risk: number;
  open_alerts: number;
  recovery_pending: number;
  last_updated: string;
}

export interface AtRiskGuest {
  guest_id: number;
  guest_name: string;
  email: string;
  priority: string;
  churn_probability: number;
  alert_message: string;
  days_since_alert: number;
  vip_status: boolean;
}

export interface RecoveryOpportunity {
  recovery_id: number;
  guest_id: number;
  guest_name: string;
  issue_type: string;
  issue_description: string;
  severity: number;
  recommended_actions: string[];
  detected_at: string;
  status: string;
}

export interface SentimentAnalysis {
  sentiment_score: number;
  sentiment_label: string;
  primary_emotion: string;
  emotion_intensity: number;
  aspect_sentiments: Record<string, { sentiment: number; mentions: number; label: string }>;
  triggers: Array<{ aspect?: string; keyword?: string; sentiment: string; type: string }>;
  analysis_summary: string;
  confidence: number;
}

export interface CampaignRecommendations {
  win_back: CampaignGuest[];
  loyalty: CampaignGuest[];
  upsell: CampaignGuest[];
  direct_booking: CampaignGuest[];
}

interface CampaignGuest {
  guest_id: number;
  guest_name: string;
  priority: string;
  channel: string;
  predicted_conversion: number;
  ltv: number;
}

export interface AIAlert {
  id: number;
  guest_id: number;
  guest_name: string;
  alert_type: string;
  priority: string;
  title: string;
  message: string;
  trigger_value: number;
  status: string;
  created_at: string;
}

export interface SegmentAnalysis {
  total_analyzed: number;
  health_segments: Record<string, number>;
  churn_segments: Record<string, number>;
  ltv_segments: Record<string, number>;
  analyzed_at: string;
}

// API Service
class CRMAIService {
  private baseUrl = '/api/v1/crm-ai';

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get(`${this.baseUrl}/dashboard`);
    return response.data.data;
  }

  // Guest Intelligence
  async getGuestIntelligence(guestId: number, includeHistory = false): Promise<GuestIntelligence> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/intelligence`, {
      params: { include_history: includeHistory }
    });
    return response.data.data;
  }

  async getGuestHealthScore(guestId: number): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/health-score`);
    return response.data.data;
  }

  async getGuestChurnRisk(guestId: number): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/churn-risk`);
    return response.data.data;
  }

  async getGuestLTV(guestId: number): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/ltv`);
    return response.data.data;
  }

  async getGuestRebookingProbability(guestId: number, timeframeDays = 90): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/rebooking`, {
      params: { timeframe_days: timeframeDays }
    });
    return response.data.data;
  }

  // Sentiment Analysis
  async analyzeGuestSentiment(
    guestId: number,
    text: string,
    source = 'feedback',
    bookingId?: number
  ): Promise<{ guest_id: number; analysis: SentimentAnalysis; recovery_triggered: boolean }> {
    const response = await api.post(`${this.baseUrl}/guests/${guestId}/sentiment`, {
      text,
      source,
      booking_id: bookingId
    });
    return response.data.data;
  }

  async getGuestSentimentTimeline(guestId: number, days = 90): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/sentiment/timeline`, {
      params: { days }
    });
    return response.data.data;
  }

  async analyzeTextSentiment(text: string, source = 'feedback'): Promise<SentimentAnalysis> {
    const response = await api.post(`${this.baseUrl}/sentiment/analyze`, { text, source });
    return response.data.data;
  }

  // At-Risk Guests & Recovery
  async getAtRiskGuests(limit = 50, minChurnRisk = 60): Promise<{ at_risk_count: number; guests: AtRiskGuest[] }> {
    const response = await api.get(`${this.baseUrl}/at-risk-guests`, {
      params: { limit, min_churn_risk: minChurnRisk }
    });
    return response.data.data;
  }

  async getRecoveryOpportunities(status = 'detected', limit = 20): Promise<{ count: number; opportunities: RecoveryOpportunity[] }> {
    const response = await api.get(`${this.baseUrl}/recovery/opportunities`, {
      params: { status, limit }
    });
    return response.data.data;
  }

  async resolveRecovery(
    recoveryId: number,
    actionTaken: string,
    compensationOffered?: string,
    compensationValue?: number
  ): Promise<any> {
    const response = await api.post(`${this.baseUrl}/recovery/${recoveryId}/resolve`, {
      action_taken: actionTaken,
      compensation_offered: compensationOffered,
      compensation_value: compensationValue
    });
    return response.data;
  }

  // Campaign Optimization
  async getCampaignRecommendations(campaignType?: string, limit = 100): Promise<CampaignRecommendations> {
    const response = await api.get(`${this.baseUrl}/campaigns/recommendations`, {
      params: { campaign_type: campaignType, limit }
    });
    return response.data.data;
  }

  async getGuestCampaignRecommendation(guestId: number): Promise<any> {
    const response = await api.get(`${this.baseUrl}/guests/${guestId}/campaign-recommendation`);
    return response.data.data;
  }

  // Alerts
  async getAIAlerts(status = 'open', priority?: string, limit = 50): Promise<{ count: number; alerts: AIAlert[] }> {
    const response = await api.get(`${this.baseUrl}/alerts`, {
      params: { status, priority, limit }
    });
    return response.data.data;
  }

  async updateAlert(alertId: number, status: string, resolutionNotes?: string): Promise<any> {
    const response = await api.patch(`${this.baseUrl}/alerts/${alertId}`, {
      status,
      resolution_notes: resolutionNotes
    });
    return response.data;
  }

  // Batch & Segments
  async batchCalculateScores(guestIds: number[]): Promise<any> {
    const response = await api.post(`${this.baseUrl}/batch/calculate-scores`, {
      guest_ids: guestIds
    });
    return response.data.data;
  }

  async getSegmentAnalysis(): Promise<SegmentAnalysis> {
    const response = await api.get(`${this.baseUrl}/segments/analysis`);
    return response.data.data;
  }
}

export const crmAIService = new CRMAIService();
export default crmAIService;
