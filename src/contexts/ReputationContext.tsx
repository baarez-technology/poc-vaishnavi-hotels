import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { api } from '@/lib/api';

// Import dummy data as fallback
import reviewsData from '@/data/dummy/reviews.json';
import keywordsData from '@/data/dummy/keywords.json';
import otaData from '@/data/dummy/ota.json';
import sentimentData from '@/data/dummy/sentiment.json';

const STORAGE_KEY = 'glimmora_reputation_data';
const SETTINGS_KEY = 'glimmora_reputation_settings';

interface TrendData {
  rating_change: number;
  direction: string;
  current_period: { avg_rating: number; count: number };
  previous_period: { avg_rating: number; count: number };
}

interface PerformanceGoal {
  id: number;
  metric_type: string;
  target_value: number;
  current_value: number | null;
  baseline_value: number;
  progress_percentage: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface CompetitorBenchmark {
  competitor_name: string;
  source: string;
  rating: number;
  review_count: number;
  response_rate: number | null;
  our_rating: number | null;
  rating_gap: number | null;
}

interface ReputationContextType {
  reviews: any[];
  keywords: any[];
  sentiment: any[];
  otaRatings: any;
  filters: any;
  settings: any;
  isLoading: boolean;
  filteredReviews: any[];
  metrics: any;
  loadReputation: () => void;
  saveReputation: () => void;
  updateFilters: (newFilters: any) => void;
  updateSettings: (newSettings: any) => void;
  addReviewResponse: (reviewId: string, responseText: string) => void;
  analyzeSentiment: (reviewText: string) => number;
  detectKeywords: (reviewText: string) => any[];
  computeOTAScore: string | number;
  computeTrend: number;
  generateAutoReply: (review: any) => string;
  updateCRMGuestSentiment: (guestEmail: string, sentimentScore: number, reviewId: string) => any;
  influenceChurnProbability: (rating: number) => any;
  influenceLTVCurve: (rating: number, existingLTV: number) => number;
  affectDemandWeighting: any;
  affectRateRecommendations: any[];
  dashboardData: any | null;
  trendsData: TrendData | null;
  pendingReviews: any[];
  goals: PerformanceGoal[];
  competitors: CompetitorBenchmark[];
  fetchDashboard: () => Promise<void>;
  fetchAnalytics: (source?: string, startDate?: string, endDate?: string) => Promise<any>;
  fetchTrends: (days?: number) => Promise<void>;
  fetchPendingReviews: (page?: number, pageSize?: number) => Promise<void>;
  generateDraft: (reviewId: number, tone?: string, includeResolution?: boolean) => Promise<any>;
  approveDraft: (draftId: number, finalText?: string) => Promise<any>;
  fetchCompetitors: () => Promise<void>;
  createGoal: (metricType: string, targetValue: number, startDate: string, endDate: string) => Promise<any>;
  updateGoalProgress: (goalId: number) => Promise<any>;
}

const ReputationContext = createContext<ReputationContextType | null>(null);

interface ReputationProviderProps {
  children: ReactNode;
}

export function ReputationProvider({ children }: ReputationProviderProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any[]>([]);
  const [otaRatings, setOtaRatings] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [trendsData, setTrendsData] = useState<TrendData | null>(null);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorBenchmark[]>([]);

  const [filters, setFilters] = useState({
    source: 'all',
    rating: 'all',
    sentimentRange: 'all',
    dateRange: '30d',
    keyword: ''
  });

  const [settings, setSettings] = useState({
    autoReply: {
      enabled: false,
      delay: '3h',
      language: 'en',
      templates: {
        positive: "Thank you so much for your wonderful review, {guest}! We're thrilled you enjoyed your stay at Glimmora.",
        neutral: "Thank you for your feedback, {guest}. We appreciate you taking the time to share your experience.",
        negative: "Dear {guest}, we sincerely apologize for not meeting your expectations. Your feedback is valuable."
      }
    }
  });

  // ==================== API METHODS ====================

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/reputation/dashboard');
      const data = response.data?.data || response.data;
      setDashboardData(data);
      if (data?.source_breakdown) {
        const otaFromApi: Record<string, any> = {};
        data.source_breakdown.forEach((source: any) => {
          otaFromApi[source.source] = { rating: source.avg_rating, reviews: source.count, trend: 0 };
        });
        if (Object.keys(otaFromApi).length > 0) setOtaRatings(otaFromApi);
      }
      if (data?.recent_reviews?.length > 0) setReviews(data.recent_reviews);
    } catch (error) {
      console.error('Error fetching reputation dashboard:', error);
    }
  }, []);

  const fetchAnalytics = useCallback(async (source?: string, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams();
      if (source) params.append('source', source);
      if (startDate) params.append('start_date', startDate);
      if (endDate) params.append('end_date', endDate);
      const response = await api.get(`/api/v1/reputation/analytics?${params}`);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return null;
    }
  }, []);

  const fetchTrends = useCallback(async (days: number = 14) => {
    try {
      const response = await api.get(`/api/v1/reputation/trends?days=${days}`);
      setTrendsData(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  }, []);

  const fetchPendingReviews = useCallback(async (page: number = 1, pageSize: number = 20) => {
    try {
      const response = await api.get(`/api/v1/reputation/reviews/pending?page=${page}&page_size=${pageSize}`);
      const data = response.data?.data || response.data;
      setPendingReviews(data?.reviews || data || []);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    }
  }, []);

  const generateDraft = useCallback(async (reviewId: number, tone: string = 'professional', includeResolution: boolean = false) => {
    const response = await api.post(`/api/v1/reputation/reviews/${reviewId}/generate-draft`, { tone, include_resolution: includeResolution });
    return response.data?.data || response.data;
  }, []);

  const approveDraft = useCallback(async (draftId: number, finalText?: string) => {
    const response = await api.post(`/api/v1/reputation/drafts/${draftId}/approve`, { final_text: finalText });
    return response.data?.data || response.data;
  }, []);

  const fetchCompetitors = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/reputation/competitors');
      const data = response.data?.data || response.data;
      setCompetitors(data?.competitors || data || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    }
  }, []);

  const createGoal = useCallback(async (metricType: string, targetValue: number, startDate: string, endDate: string) => {
    const response = await api.post('/api/v1/reputation/goals', { metric_type: metricType, target_value: targetValue, start_date: startDate, end_date: endDate });
    const newGoal = response.data?.data || response.data;
    setGoals(prev => [...prev, newGoal]);
    return newGoal;
  }, []);

  const updateGoalProgress = useCallback(async (goalId: number) => {
    const response = await api.patch(`/api/v1/reputation/goals/${goalId}/progress`);
    const updatedGoal = response.data?.data || response.data;
    setGoals(prev => prev.map(g => g.id === goalId ? updatedGoal : g));
    return updatedGoal;
  }, []);

  // ==================== LEGACY METHODS ====================

  const loadReputation = useCallback(() => {
    setIsLoading(true);
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setReviews(parsed.reviews || reviewsData);
        setKeywords(parsed.keywords || keywordsData);
        setSentiment(parsed.sentiment || sentimentData);
        setOtaRatings(parsed.otaRatings || otaData);
      } else {
        setReviews(reviewsData);
        setKeywords(keywordsData);
        setSentiment(sentimentData);
        setOtaRatings(otaData);
      }
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (error) {
      console.error('Error loading reputation data:', error);
      setReviews(reviewsData);
      setKeywords(keywordsData);
      setSentiment(sentimentData);
      setOtaRatings(otaData);
    }
    setIsLoading(false);
  }, []);

  const saveReputation = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ reviews, keywords, sentiment, otaRatings }));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving reputation data:', error);
    }
  }, [reviews, keywords, sentiment, otaRatings, settings]);

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchDashboard(), fetchTrends(), fetchPendingReviews(), fetchCompetitors()]);
      } catch (error) {
        console.log('API not available, using local data');
      }
      loadReputation();
      setIsLoading(false);
    };
    initializeData();
  }, [fetchDashboard, fetchTrends, fetchPendingReviews, fetchCompetitors, loadReputation]);

  useEffect(() => {
    if (!isLoading) saveReputation();
  }, [reviews, keywords, sentiment, otaRatings, settings, isLoading, saveReputation]);

  const analyzeSentiment = useCallback((reviewText: string): number => {
    const positiveWords = ['excellent', 'amazing', 'wonderful', 'great', 'fantastic', 'beautiful', 'clean', 'friendly', 'helpful', 'perfect', 'loved', 'best', 'comfortable'];
    const negativeWords = ['terrible', 'awful', 'worst', 'dirty', 'rude', 'slow', 'disappointing', 'horrible', 'poor', 'bad', 'issues', 'problem'];
    const words = reviewText.toLowerCase().split(/\s+/);
    let positiveCount = 0, negativeCount = 0;
    words.forEach(word => {
      if (positiveWords.some(pw => word.includes(pw))) positiveCount++;
      if (negativeWords.some(nw => word.includes(nw))) negativeCount++;
    });
    const total = positiveCount + negativeCount || 1;
    return Math.max(0, Math.min(100, Math.round(50 + ((positiveCount - negativeCount) / total) * 50)));
  }, []);

  const detectKeywords = useCallback((reviewText: string): any[] => {
    const patterns = [
      { pattern: /clean|spotless|tidy/gi, keyword: 'clean', sentiment: 'positive' },
      { pattern: /dirty|unclean|mess/gi, keyword: 'cleanliness issues', sentiment: 'negative' },
      { pattern: /staff|service|helpful|friendly/gi, keyword: 'staff', sentiment: 'positive' },
      { pattern: /rude|unhelpful|unresponsive/gi, keyword: 'staff issues', sentiment: 'negative' },
      { pattern: /breakfast|food|dining|restaurant/gi, keyword: 'food', sentiment: 'positive' },
      { pattern: /spa|massage|wellness/gi, keyword: 'spa', sentiment: 'positive' },
      { pattern: /pool|swimming/gi, keyword: 'pool', sentiment: 'positive' },
      { pattern: /wifi|internet/gi, keyword: 'wifi', sentiment: 'neutral' },
      { pattern: /noise|loud|noisy/gi, keyword: 'noise', sentiment: 'negative' },
      { pattern: /location|area|nearby/gi, keyword: 'location', sentiment: 'positive' },
      { pattern: /view|views|scenery/gi, keyword: 'views', sentiment: 'positive' }
    ];
    const detected: any[] = [];
    patterns.forEach(({ pattern, keyword, sentiment }) => {
      if (pattern.test(reviewText)) detected.push({ keyword, sentiment });
    });
    return detected;
  }, []);

  const computeOTAScore = useMemo(() => {
    if (dashboardData?.metrics?.average_rating) return dashboardData.metrics.average_rating.toFixed(1);
    const ratings = Object.values(otaRatings);
    if (ratings.length === 0) return 0;
    const totalReviews = ratings.reduce((sum: number, ota: any) => sum + (ota.reviews || 0), 0);
    const weightedSum = ratings.reduce((sum: number, ota: any) => sum + (ota.rating * (ota.reviews || 1)), 0);
    return totalReviews > 0 ? (weightedSum / totalReviews).toFixed(1) : 0;
  }, [otaRatings, dashboardData]);

  const computeTrend = useMemo(() => {
    if (trendsData?.rating_change !== undefined) return Math.round(trendsData.rating_change * 10);
    if (sentiment.length < 7) return 0;
    const recent = sentiment.slice(-7);
    const previous = sentiment.slice(-14, -7);
    const recentAvg = recent.reduce((sum: number, d: any) => sum + d.score, 0) / recent.length;
    const previousAvg = previous.length > 0 ? previous.reduce((sum: number, d: any) => sum + d.score, 0) / previous.length : recentAvg;
    return Math.round(recentAvg - previousAvg);
  }, [sentiment, trendsData]);

  const generateAutoReply = useCallback((review: any): string => {
    const { sentiment: score, guest } = review;
    let template: string;
    if (score < 40) template = settings.autoReply.templates.negative;
    else if (score <= 70) template = settings.autoReply.templates.neutral;
    else template = settings.autoReply.templates.positive;
    return template.replace('{guest}', guest?.split(' ')[0] || 'Guest');
  }, [settings.autoReply.templates]);

  const updateCRMGuestSentiment = useCallback((guestEmail: string, sentimentScore: number, reviewId: string) => {
    return { guestEmail, sentimentScore, reviewId, timestamp: new Date().toISOString() };
  }, []);

  const influenceChurnProbability = useCallback((rating: number) => {
    if (rating <= 2) return { change: 25, direction: 'increase' };
    if (rating <= 3) return { change: 10, direction: 'increase' };
    if (rating >= 4.5) return { change: -15, direction: 'decrease' };
    return { change: 0, direction: 'stable' };
  }, []);

  const influenceLTVCurve = useCallback((rating: number, existingLTV: number): number => {
    const multiplier = rating <= 2 ? 0.8 : rating >= 4.5 ? 1.15 : 1;
    return Math.round(existingLTV * multiplier);
  }, []);

  const affectDemandWeighting = useMemo(() => {
    const avgSentiment = sentiment.slice(-7).reduce((sum: number, d: any) => sum + d.score, 0) / 7;
    if (avgSentiment < 50) return { modifier: -0.1, reason: 'Low sentiment affecting demand' };
    if (avgSentiment > 80) return { modifier: 0.1, reason: 'High sentiment boosting demand' };
    return { modifier: 0, reason: 'Stable sentiment' };
  }, [sentiment]);

  const affectRateRecommendations = useMemo(() => {
    const recentSentiment = sentiment.slice(-7);
    const avgSentiment = recentSentiment.reduce((sum: number, d: any) => sum + d.score, 0) / recentSentiment.length;
    const trend = computeTrend;
    const recommendations: any[] = [];
    if (avgSentiment < 50) recommendations.push({ type: 'rate_decrease', suggestion: '-3% to -5%', reason: `Sentiment at ${Math.round(avgSentiment)}%`, confidence: 'high' });
    else if (avgSentiment > 80 && trend > 5) recommendations.push({ type: 'rate_increase', suggestion: '+5% to +8%', reason: `Strong sentiment (${Math.round(avgSentiment)}%)`, confidence: 'high' });
    else if (trend < -10) recommendations.push({ type: 'rate_hold', suggestion: 'Hold current rates', reason: `Declining trend (${trend}%)`, confidence: 'medium' });
    return recommendations;
  }, [sentiment, computeTrend]);

  const addReviewResponse = useCallback((reviewId: string, responseText: string) => {
    setReviews((prev: any[]) => prev.map(review => review.id === reviewId ? { ...review, responded: true, responseText } : review));
  }, []);

  const updateFilters = useCallback((newFilters: any) => {
    setFilters((prev: any) => ({ ...prev, ...newFilters }));
  }, []);

  const updateSettings = useCallback((newSettings: any) => {
    setSettings((prev: any) => ({ ...prev, ...newSettings }));
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review: any) => {
      if (filters.source !== 'all' && review.source?.toLowerCase() !== filters.source.toLowerCase()) return false;
      if (filters.rating !== 'all') {
        const ratingNum = parseFloat(filters.rating);
        if (review.rating < ratingNum || review.rating >= ratingNum + 1) return false;
      }
      if (filters.sentimentRange !== 'all') {
        if (filters.sentimentRange === 'positive' && review.sentiment < 70) return false;
        if (filters.sentimentRange === 'negative' && review.sentiment >= 40) return false;
        if (filters.sentimentRange === 'neutral' && (review.sentiment < 40 || review.sentiment >= 70)) return false;
      }
      if (filters.keyword && !review.keywords?.some((k: string) => k.toLowerCase().includes(filters.keyword.toLowerCase()))) return false;
      return true;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [reviews, filters]);

  const metrics = useMemo(() => {
    if (dashboardData?.metrics) {
      const apiMetrics = dashboardData.metrics;
      return {
        overallSentiment: Math.round(apiMetrics.sentiment?.positive || 0),
        positivePercent: Math.round(apiMetrics.sentiment?.positive || 0),
        negativePercent: Math.round(apiMetrics.sentiment?.negative || 0),
        neutralPercent: Math.round(apiMetrics.sentiment?.neutral || 0),
        avgOTARating: (apiMetrics.average_rating || 0).toFixed(1),
        newReviewsToday: dashboardData.recent_reviews?.length || 0,
        reviewVolumeTrend: computeTrend,
        totalReviews: apiMetrics.total_reviews || reviews.length,
        responseRate: apiMetrics.response_rate || 0,
        npsScore: apiMetrics.nps_score || 0
      };
    }
    const recentSentiment = sentiment.slice(-7);
    const avgSentiment = recentSentiment.reduce((sum: number, d: any) => sum + d.score, 0) / recentSentiment.length;
    const avgPositive = recentSentiment.reduce((sum: number, d: any) => sum + d.positive, 0) / recentSentiment.length;
    const avgNegative = recentSentiment.reduce((sum: number, d: any) => sum + d.negative, 0) / recentSentiment.length;
    const avgNeutral = recentSentiment.reduce((sum: number, d: any) => sum + d.neutral, 0) / recentSentiment.length;
    const otaValues = Object.values(otaRatings);
    const avgOTARating = otaValues.reduce((sum: number, ota: any) => sum + ota.rating, 0) / otaValues.length;
    const today = new Date().toISOString().split('T')[0];
    const newReviewsToday = reviews.filter((r: any) => r.date === today).length;
    return {
      overallSentiment: Math.round(avgSentiment),
      positivePercent: Math.round(avgPositive),
      negativePercent: Math.round(avgNegative),
      neutralPercent: Math.round(avgNeutral),
      avgOTARating: avgOTARating.toFixed(1),
      newReviewsToday,
      reviewVolumeTrend: computeTrend,
      totalReviews: reviews.length,
      responseRate: 0,
      npsScore: 0
    };
  }, [sentiment, otaRatings, reviews, computeTrend, dashboardData]);

  const value: ReputationContextType = {
    reviews, keywords, sentiment, otaRatings, filters, settings, isLoading, filteredReviews, metrics,
    loadReputation, saveReputation, updateFilters, updateSettings, addReviewResponse, analyzeSentiment,
    detectKeywords, computeOTAScore, computeTrend, generateAutoReply, updateCRMGuestSentiment,
    influenceChurnProbability, influenceLTVCurve, affectDemandWeighting, affectRateRecommendations,
    dashboardData, trendsData, pendingReviews, goals, competitors,
    fetchDashboard, fetchAnalytics, fetchTrends, fetchPendingReviews, generateDraft, approveDraft,
    fetchCompetitors, createGoal, updateGoalProgress
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
