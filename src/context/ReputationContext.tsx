import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import reputationService, {
  ReputationDashboard,
  ReviewAnalytics,
  TrendData,
  Review,
  ResponseDraft
} from '../api/services/reputation.service';

const SETTINGS_KEY = 'glimmora_reputation_settings';

interface ReputationContextType {
  // State
  dashboard: ReputationDashboard | null;
  analytics: ReviewAnalytics | null;
  trends: TrendData | null;
  pendingReviews: Review[];
  isLoading: boolean;
  error: string | null;
  filters: {
    source: string;
    rating: string;
    sentimentRange: string;
    dateRange: string;
    keyword: string;
  };
  settings: {
    autoReply: {
      enabled: boolean;
      delay: string;
      language: string;
      templates: {
        positive: string;
        neutral: string;
        negative: string;
      };
    };
  };

  // Computed
  reviews: Review[];
  keywords: Array<{ keyword: string; count: number; sentiment: string }>;
  sentiment: Array<{ date: string; score: number; positive: number; neutral: number; negative: number }>;
  otaRatings: Record<string, { rating: number; reviews: number; trend: number }>;
  filteredReviews: Review[];
  metrics: {
    overallSentiment: number;
    positivePercent: number;
    negativePercent: number;
    neutralPercent: number;
    avgOTARating: string;
    newReviewsToday: number;
    reviewVolumeTrend: number;
    totalReviews: number;
  };

  // Functions
  loadReputation: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshAnalytics: (source?: string, startDate?: string, endDate?: string) => Promise<void>;
  refreshTrends: (days?: number) => Promise<void>;
  loadPendingReviews: (page?: number) => Promise<void>;
  generateResponseDraft: (reviewId: number, tone?: string) => Promise<ResponseDraft>;
  approveResponse: (draftId: number, finalText?: string) => Promise<void>;
  updateFilters: (newFilters: Partial<ReputationContextType['filters']>) => void;
  updateSettings: (newSettings: Partial<ReputationContextType['settings']>) => void;
  addReviewResponse: (reviewId: number, responseText: string) => void;

  // AI Analysis (local)
  analyzeSentiment: (text: string) => number;
  detectKeywords: (text: string) => Array<{ keyword: string; sentiment: string }>;
  computeOTAScore: number;
  computeTrend: number;
  generateAutoReply: (review: { sentiment: number; guest: string }) => string;

  // CRM Integration
  updateCRMGuestSentiment: (guestEmail: string, sentimentScore: number, reviewId: number) => any;
  influenceChurnProbability: (rating: number) => { change: number; direction: string };
  influenceLTVCurve: (rating: number, existingLTV: number) => number;

  // Revenue AI Integration
  affectDemandWeighting: { modifier: number; reason: string };
  affectRateRecommendations: Array<{ type: string; suggestion: string; reason: string; confidence: string }>;
}

const ReputationContext = createContext<ReputationContextType | null>(null);

export function ReputationProvider({ children }: { children: React.ReactNode }) {
  // Core state from API
  const [dashboard, setDashboard] = useState<ReputationDashboard | null>(null);
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [pendingReviews, setPendingReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    source: 'all',
    rating: 'all',
    sentimentRange: 'all',
    dateRange: '30d',
    keyword: ''
  });

  // Settings state (persisted locally)
  const [settings, setSettings] = useState({
    autoReply: {
      enabled: false,
      delay: '3h',
      language: 'en',
      templates: {
        positive: "Thank you so much for your wonderful review, {guest}! We're thrilled you enjoyed your stay at Glimmora. We look forward to welcoming you back soon!",
        neutral: "Thank you for your feedback, {guest}. We appreciate you taking the time to share your experience. Your insights help us improve our services.",
        negative: "Dear {guest}, we sincerely apologize for not meeting your expectations. Your feedback is valuable, and we're taking immediate steps to address your concerns. Please contact our guest relations team so we can make this right."
      }
    }
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.error('Error loading reputation settings:', err);
    }
  }, []);

  // Save settings when they change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving reputation settings:', err);
    }
  }, [settings]);

  // Fetch dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await reputationService.getDashboard();
      setDashboard(data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching reputation dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard');
    }
  }, []);

  // Fetch analytics data
  const refreshAnalytics = useCallback(async (source?: string, startDate?: string, endDate?: string) => {
    try {
      const data = await reputationService.getAnalytics(source, startDate, endDate);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  // Fetch trends data
  const refreshTrends = useCallback(async (days: number = 14) => {
    try {
      const data = await reputationService.getTrends(days);
      setTrends(data);
    } catch (err: any) {
      console.error('Error fetching trends:', err);
    }
  }, []);

  // Load pending reviews
  const loadPendingReviews = useCallback(async (page: number = 1) => {
    try {
      const data = await reputationService.getPendingReviews(page);
      setPendingReviews(data.reviews || []);
    } catch (err: any) {
      console.error('Error fetching pending reviews:', err);
    }
  }, []);

  // Load all reputation data
  const loadReputation = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshDashboard(),
        refreshAnalytics(),
        refreshTrends(),
        loadPendingReviews()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load reputation data');
    } finally {
      setIsLoading(false);
    }
  }, [refreshDashboard, refreshAnalytics, refreshTrends, loadPendingReviews]);

  // Load on mount
  useEffect(() => {
    loadReputation();
  }, [loadReputation]);

  // Generate response draft
  const generateResponseDraft = useCallback(async (reviewId: number, tone: string = 'professional'): Promise<ResponseDraft> => {
    return await reputationService.generateResponseDraft(reviewId, tone);
  }, []);

  // Approve response
  const approveResponse = useCallback(async (draftId: number, finalText?: string) => {
    await reputationService.approveResponse(draftId, finalText);
    // Refresh pending reviews after approving
    await loadPendingReviews();
  }, [loadPendingReviews]);

  // Derived data from dashboard/analytics for backward compatibility
  const reviews = useMemo(() => {
    return dashboard?.recent_reviews || [];
  }, [dashboard]);

  const keywords = useMemo(() => {
    return analytics?.top_keywords || [];
  }, [analytics]);

  const sentiment = useMemo(() => {
    if (!dashboard?.sentiment_trend) return [];
    return dashboard.sentiment_trend.map(item => ({
      date: item.date,
      score: Math.round((item.positive * 100 + item.neutral * 50) / (item.positive + item.neutral + item.negative || 1)),
      positive: item.positive,
      neutral: item.neutral,
      negative: item.negative
    }));
  }, [dashboard]);

  const otaRatings = useMemo(() => {
    if (!dashboard?.source_breakdown) return {};
    const ratings: Record<string, { rating: number; reviews: number; trend: number }> = {};
    dashboard.source_breakdown.forEach(source => {
      ratings[source.source] = {
        rating: source.average_rating,
        reviews: source.count,
        trend: 0
      };
    });
    return ratings;
  }, [dashboard]);

  // AI Analysis Functions (local fallbacks)
  const analyzeSentiment = useCallback((reviewText: string) => {
    const positiveWords = ['excellent', 'amazing', 'wonderful', 'great', 'fantastic', 'beautiful', 'clean', 'friendly', 'helpful', 'perfect', 'loved', 'best', 'comfortable', 'delicious', 'exceptional', 'spotless', 'professional', 'attentive', 'luxurious', 'stunning'];
    const negativeWords = ['terrible', 'awful', 'worst', 'dirty', 'rude', 'slow', 'disappointing', 'horrible', 'poor', 'bad', 'issues', 'problem', 'delay', 'wait', 'noise', 'smell', 'broken', 'unresponsive', 'overpriced', 'frustrated'];

    const words = reviewText.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });

    const total = positiveCount + negativeCount || 1;
    const score = Math.round(50 + ((positiveCount - negativeCount) / total) * 50);

    return Math.max(0, Math.min(100, score));
  }, []);

  const detectKeywords = useCallback((reviewText: string) => {
    const keywordPatterns = [
      { pattern: /clean|spotless|tidy/gi, keyword: 'clean', sentiment: 'positive' },
      { pattern: /dirty|unclean|mess/gi, keyword: 'cleanliness issues', sentiment: 'negative' },
      { pattern: /staff|service|helpful|friendly/gi, keyword: 'staff', sentiment: 'positive' },
      { pattern: /rude|unhelpful|unresponsive/gi, keyword: 'staff issues', sentiment: 'negative' },
      { pattern: /breakfast|food|dining|restaurant/gi, keyword: 'food', sentiment: 'positive' },
      { pattern: /spa|massage|wellness/gi, keyword: 'spa', sentiment: 'positive' },
      { pattern: /pool|swimming/gi, keyword: 'pool', sentiment: 'positive' },
      { pattern: /wifi|internet/gi, keyword: 'wifi', sentiment: 'neutral' },
      { pattern: /check-in|checkin|wait|delay/gi, keyword: 'check-in delay', sentiment: 'negative' },
      { pattern: /location|area|nearby/gi, keyword: 'location', sentiment: 'positive' },
      { pattern: /view|views|scenery/gi, keyword: 'views', sentiment: 'positive' },
      { pattern: /bed|mattress|sleep/gi, keyword: 'bed', sentiment: 'positive' },
      { pattern: /noise|loud|noisy/gi, keyword: 'noise', sentiment: 'negative' },
      { pattern: /expensive|overpriced|pricey/gi, keyword: 'expensive', sentiment: 'negative' },
      { pattern: /ac|air condition|cooling/gi, keyword: 'AC issues', sentiment: 'negative' },
      { pattern: /gym|fitness|workout/gi, keyword: 'gym', sentiment: 'neutral' },
      { pattern: /luxur|premium|upscale/gi, keyword: 'luxury', sentiment: 'positive' }
    ];

    const detected: Array<{ keyword: string; sentiment: string }> = [];
    keywordPatterns.forEach(({ pattern, keyword, sentiment }) => {
      if (pattern.test(reviewText)) {
        detected.push({ keyword, sentiment });
      }
    });

    return detected;
  }, []);

  const computeOTAScore = useMemo(() => {
    const ratings = Object.values(otaRatings);
    if (ratings.length === 0) return 0;

    const totalReviews = ratings.reduce((sum, ota) => sum + (ota.reviews || 0), 0);
    const weightedSum = ratings.reduce((sum, ota) => sum + (ota.rating * (ota.reviews || 1)), 0);

    return totalReviews > 0 ? parseFloat((weightedSum / totalReviews).toFixed(1)) : 0;
  }, [otaRatings]);

  const computeTrend = useMemo(() => {
    if (!trends) return 0;
    return trends.sentiment_change || 0;
  }, [trends]);

  const generateAutoReply = useCallback((review: { sentiment: number; guest: string }) => {
    const { sentiment: score, guest } = review;
    let template;

    if (score < 40) {
      template = settings.autoReply.templates.negative;
    } else if (score <= 70) {
      template = settings.autoReply.templates.neutral;
    } else {
      template = settings.autoReply.templates.positive;
    }

    return template.replace('{guest}', guest.split(' ')[0]);
  }, [settings.autoReply.templates]);

  // CRM Integration Functions
  const updateCRMGuestSentiment = useCallback((guestEmail: string, sentimentScore: number, reviewId: number) => {
    console.log(`Updating CRM sentiment for ${guestEmail}: ${sentimentScore}`);
    return {
      guestEmail,
      sentimentScore,
      reviewId,
      timestamp: new Date().toISOString()
    };
  }, []);

  const influenceChurnProbability = useCallback((rating: number) => {
    if (rating <= 2) return { change: 25, direction: 'increase' };
    if (rating <= 3) return { change: 10, direction: 'increase' };
    if (rating >= 4.5) return { change: -15, direction: 'decrease' };
    return { change: 0, direction: 'stable' };
  }, []);

  const influenceLTVCurve = useCallback((rating: number, existingLTV: number) => {
    const multiplier = rating <= 2 ? 0.8 : rating >= 4.5 ? 1.15 : 1;
    return Math.round(existingLTV * multiplier);
  }, []);

  // Revenue AI Integration Functions
  const affectDemandWeighting = useMemo(() => {
    const avgSentiment = dashboard?.metrics?.sentiment
      ? (dashboard.metrics.sentiment.positive * 100) / (dashboard.metrics.sentiment.positive + dashboard.metrics.sentiment.neutral + dashboard.metrics.sentiment.negative || 1)
      : 50;

    if (avgSentiment < 50) return { modifier: -0.1, reason: 'Low sentiment affecting demand' };
    if (avgSentiment > 80) return { modifier: 0.1, reason: 'High sentiment boosting demand' };
    return { modifier: 0, reason: 'Stable sentiment' };
  }, [dashboard]);

  const affectRateRecommendations = useMemo(() => {
    const recommendations: Array<{ type: string; suggestion: string; reason: string; confidence: string }> = [];

    if (!dashboard?.metrics || !trends) return recommendations;

    const avgSentiment = (dashboard.metrics.sentiment.positive * 100) /
      (dashboard.metrics.sentiment.positive + dashboard.metrics.sentiment.neutral + dashboard.metrics.sentiment.negative || 1);
    const trendChange = trends.sentiment_change || 0;

    if (avgSentiment < 50) {
      recommendations.push({
        type: 'rate_decrease',
        suggestion: '-3% to -5%',
        reason: `Sentiment at ${Math.round(avgSentiment)}% - recommend rate moderation`,
        confidence: 'high'
      });
    } else if (avgSentiment > 80 && trendChange > 5) {
      recommendations.push({
        type: 'rate_increase',
        suggestion: '+5% to +8%',
        reason: `Strong sentiment (${Math.round(avgSentiment)}%) with positive trend`,
        confidence: 'high'
      });
    } else if (trendChange < -10) {
      recommendations.push({
        type: 'rate_hold',
        suggestion: 'Hold current rates',
        reason: `Declining sentiment trend (${trendChange}%) - monitor closely`,
        confidence: 'medium'
      });
    }

    return recommendations;
  }, [dashboard, trends]);

  // Review management
  const addReviewResponse = useCallback((reviewId: number, responseText: string) => {
    // Update local state optimistically
    setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
  }, []);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter(review => {
      if (filters.source !== 'all' && review.source.toLowerCase() !== filters.source.toLowerCase()) {
        return false;
      }
      if (filters.rating !== 'all') {
        const ratingNum = parseFloat(filters.rating);
        if (review.rating < ratingNum || review.rating >= ratingNum + 1) {
          return false;
        }
      }
      if (filters.sentimentRange !== 'all') {
        if (filters.sentimentRange === 'positive' && review.sentiment_score < 70) return false;
        if (filters.sentimentRange === 'negative' && review.sentiment_score >= 40) return false;
        if (filters.sentimentRange === 'neutral' && (review.sentiment_score < 40 || review.sentiment_score >= 70)) return false;
      }
      if (filters.keyword && !review.keywords?.some(k =>
        k.toLowerCase().includes(filters.keyword.toLowerCase())
      )) {
        return false;
      }
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, filters]);

  // Computed metrics
  const metrics = useMemo(() => {
    if (!dashboard?.metrics) {
      return {
        overallSentiment: 0,
        positivePercent: 0,
        negativePercent: 0,
        neutralPercent: 0,
        avgOTARating: '0.0',
        newReviewsToday: 0,
        reviewVolumeTrend: 0,
        totalReviews: 0
      };
    }

    const { sentiment, total_reviews, average_rating } = dashboard.metrics;
    const total = sentiment.positive + sentiment.neutral + sentiment.negative || 1;

    return {
      overallSentiment: Math.round((sentiment.positive * 100 + sentiment.neutral * 50) / total),
      positivePercent: Math.round((sentiment.positive / total) * 100),
      negativePercent: Math.round((sentiment.negative / total) * 100),
      neutralPercent: Math.round((sentiment.neutral / total) * 100),
      avgOTARating: average_rating.toFixed(1),
      newReviewsToday: reviews.filter(r => {
        const today = new Date().toISOString().split('T')[0];
        return r.created_at?.startsWith(today);
      }).length,
      reviewVolumeTrend: computeTrend,
      totalReviews: total_reviews
    };
  }, [dashboard, reviews, computeTrend]);

  const value: ReputationContextType = {
    // State
    dashboard,
    analytics,
    trends,
    pendingReviews,
    isLoading,
    error,
    filters,
    settings,

    // Derived for backward compatibility
    reviews,
    keywords,
    sentiment,
    otaRatings,
    filteredReviews,
    metrics,

    // Core functions
    loadReputation,
    refreshDashboard,
    refreshAnalytics,
    refreshTrends,
    loadPendingReviews,
    generateResponseDraft,
    approveResponse,
    updateFilters,
    updateSettings,
    addReviewResponse,

    // AI Analysis
    analyzeSentiment,
    detectKeywords,
    computeOTAScore,
    computeTrend,
    generateAutoReply,

    // CRM Integration
    updateCRMGuestSentiment,
    influenceChurnProbability,
    influenceLTVCurve,

    // Revenue AI Integration
    affectDemandWeighting,
    affectRateRecommendations
  };

  return (
    <ReputationContext.Provider value={value}>
      {children}
    </ReputationContext.Provider>
  );
}

export function useReputation() {
  const context = useContext(ReputationContext);
  if (!context) {
    throw new Error('useReputation must be used within a ReputationProvider');
  }
  return context;
}

export default ReputationContext;
