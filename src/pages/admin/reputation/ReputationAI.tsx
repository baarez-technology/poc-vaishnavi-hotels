import { useState, useCallback } from 'react';
import { Download, RefreshCw, MessageSquare, Sparkles } from 'lucide-react';

// Import context
import { ReputationProvider, useReputation } from '../../../context/ReputationContext';

// Import components
import SentimentSummary from '../../../components/reputation/SentimentSummary';
import SentimentTrendChart from '../../../components/reputation/SentimentTrendChart';
import OTAScoreChart from '../../../components/reputation/OTAScoreChart';
import KeywordFrequency from '../../../components/reputation/KeywordFrequency';
import ReviewFeed from '../../../components/reputation/ReviewFeed';
import ReviewDetailDrawer from '../../../components/reputation/ReviewDetailDrawer';
import AutoReplies from '../../../components/reputation/AutoReplies';
import FiltersBar from '../../../components/reputation/FiltersBar';
import ImpactOnRevenue from '../../../components/reputation/ImpactOnRevenue';
import CRMGuestImpact from '../../../components/reputation/CRMGuestImpact';

function ReputationAIContent() {
  const {
    sentiment,
    otaRatings,
    keywords,
    filteredReviews,
    filters,
    settings,
    metrics,
    isLoading,
    updateFilters,
    updateSettings,
    addReviewResponse,
    generateAutoReply,
    influenceChurnProbability,
    influenceLTVCurve,
    affectRateRecommendations
  } = useReputation();

  const [selectedReview, setSelectedReview] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const handleReviewClick = useCallback((review) => {
    setSelectedReview(review);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedReview(null);
  }, []);

  const handleRespondToReview = useCallback((reviewId, responseText) => {
    addReviewResponse(reviewId, responseText);
    setSelectedReview(null);
  }, [addReviewResponse]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const handleExportCSV = useCallback(() => {
    const csvRows = [
      ['Reputation AI Report', new Date().toLocaleDateString()],
      [],
      ['Summary Metrics'],
      ['Overall Sentiment', metrics.overallSentiment],
      ['Positive %', metrics.positivePercent],
      ['Negative %', metrics.negativePercent],
      ['Avg OTA Rating', metrics.avgOTARating],
      ['Total Reviews', metrics.totalReviews],
      [],
      ['Reviews'],
      ['ID', 'Guest', 'Source', 'Rating', 'Sentiment', 'Date', 'Title', 'Responded'],
      ...filteredReviews.map(r => [
        r.id,
        r.guest,
        r.source,
        r.rating,
        r.sentiment,
        r.date,
        `"${r.title}"`,
        r.responded ? 'Yes' : 'No'
      ]),
      [],
      ['Keywords'],
      ['Keyword', 'Mentions', 'Sentiment'],
      ...keywords.map(k => [k.keyword, k.mentions, k.sentiment])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reputation-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredReviews, keywords, metrics]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF7F4]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#A57865] animate-spin mx-auto mb-2" />
          <p className="text-neutral-600">Loading reputation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#FAF7F4]">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-[#A57865] flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Reputation AI</h1>
                <p className="text-sm text-neutral-500">
                  Review intelligence, sentiment analysis & automated responses
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors ${
                isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh AI Analysis
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-[#A57865] hover:bg-[#A57865]/90 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <FiltersBar filters={filters} onFilterChange={updateFilters} />

        {/* Sentiment Summary KPIs */}
        <SentimentSummary metrics={metrics} />

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SentimentTrendChart data={sentiment} />
          <OTAScoreChart data={otaRatings} />
        </div>

        {/* Secondary Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <KeywordFrequency data={keywords} />
          <div className="lg:col-span-2">
            <ReviewFeed reviews={filteredReviews} onReviewClick={handleReviewClick} />
          </div>
        </div>

        {/* AI Integration Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ImpactOnRevenue
            sentimentData={sentiment}
            recommendations={affectRateRecommendations}
          />
          <CRMGuestImpact
            review={selectedReview}
            influenceChurnProbability={influenceChurnProbability}
            influenceLTVCurve={influenceLTVCurve}
          />
        </div>

        {/* Auto-Reply Engine */}
        <AutoReplies settings={settings} onSettingsChange={updateSettings} />

        {/* Footer Stats */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Reputation Engine</p>
                <p className="text-lg font-bold text-[#4E5840]">Active</p>
              </div>
              <div className="h-8 w-px bg-neutral-200" />
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">NLP Model</p>
                <p className="text-lg font-bold text-neutral-900">v3.2.0</p>
              </div>
              <div className="h-8 w-px bg-neutral-200" />
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Sentiment Accuracy</p>
                <p className="text-lg font-bold text-[#5C9BA4]">92.7%</p>
              </div>
              <div className="h-8 w-px bg-neutral-200" />
              <div>
                <p className="text-xs text-neutral-500 uppercase tracking-wider">Auto-Replies Sent</p>
                <p className="text-lg font-bold text-[#A57865]">24 this week</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-500">Powered by</p>
              <p className="text-sm font-bold text-neutral-900">Glimmora AI</p>
            </div>
          </div>
        </div>
      </div>

      {/* Review Detail Drawer */}
      {selectedReview && (
        <ReviewDetailDrawer
          review={selectedReview}
          onClose={handleCloseDrawer}
          onRespond={handleRespondToReview}
          generateAutoReply={generateAutoReply}
          guestCRMData={{
            totalStays: Math.floor(Math.random() * 10) + 1,
            ltv: Math.floor(Math.random() * 200000) + 50000,
            segment: ['Leisure', 'Business', 'VIP', 'Corporate'][Math.floor(Math.random() * 4)]
          }}
        />
      )}
    </div>
  );
}

export default function ReputationAI() {
  return (
    <ReputationProvider>
      <ReputationAIContent />
    </ReputationProvider>
  );
}
