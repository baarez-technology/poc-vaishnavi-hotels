import { useState, useCallback, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  MessageSquare,
  LayoutDashboard,
  Bell,
  Target,
  FolderOpen,
  CheckSquare,
  Settings,
  AlertTriangle
} from 'lucide-react';

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
import GoalsPanel from '../../../components/reputation/GoalsPanel';
import AlertsPanel from '../../../components/reputation/AlertsPanel';
import CategoryManager from '../../../components/reputation/CategoryManager';
import ApprovalQueue from '../../../components/reputation/ApprovalQueue';
import TemplatesManager from '../../../components/reputation/TemplatesManager';
import EngineStats from '../../../components/reputation/EngineStats';

type TabId = 'overview' | 'alerts' | 'goals' | 'categories' | 'approvals' | 'settings';

const TABS: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
];

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
    error,
    alerts,
    pendingApprovals,
    updateFilters,
    updateSettings,
    addReviewResponse,
    influenceChurnProbability,
    influenceLTVCurve,
    affectRateRecommendations,
    loadReputation,
    loadAlerts,
    loadGoals,
    loadCategories,
    loadPendingApprovals,
    loadEngineStats,
    loadAutomationConfig
  } = useReputation();

  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Load tab-specific data when tab changes
  useEffect(() => {
    const loadTabData = async () => {
      switch (activeTab) {
        case 'alerts':
          await loadAlerts();
          break;
        case 'goals':
          await loadGoals();
          break;
        case 'categories':
          await loadCategories();
          break;
        case 'approvals':
          await loadPendingApprovals();
          break;
        case 'settings':
          await loadAutomationConfig();
          await loadEngineStats();
          break;
      }
    };
    loadTabData();
  }, [activeTab, loadAlerts, loadGoals, loadCategories, loadPendingApprovals, loadEngineStats, loadAutomationConfig]);

  const handleReviewClick = useCallback((review: any) => {
    setSelectedReview(review);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setSelectedReview(null);
  }, []);

  const handleRespondToReview = useCallback((reviewId: number, responseText: string) => {
    addReviewResponse(reviewId, responseText);
    setSelectedReview(null);
  }, [addReviewResponse]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadReputation();
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [loadReputation]);

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
      ...filteredReviews.map((r: any) => [
        r.id,
        r.guest_name || r.guest,
        r.source,
        r.rating,
        r.sentiment_score || r.sentiment,
        r.created_at || r.date,
        `"${r.title || ''}"`,
        r.responded ? 'Yes' : 'No'
      ]),
      [],
      ['Keywords'],
      ['Keyword', 'Mentions', 'Sentiment'],
      ...keywords.map((k: any) => [k.keyword, k.count || k.mentions, k.sentiment])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reputation-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [filteredReviews, keywords, metrics]);

  // Calculate alert count for badge
  const activeAlertCount = alerts.filter(a => a.status === 'active' || a.status === 'new').length;
  const pendingApprovalCount = pendingApprovals.length;

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

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF7F4]">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">Failed to Load Data</h3>
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-[#A57865] text-white rounded-lg hover:bg-[#A57865]/90 transition-colors"
          >
            Try Again
          </button>
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
              className={`flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
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

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl border border-neutral-200 p-1 flex gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const badgeCount = tab.id === 'alerts' ? activeAlertCount :
              tab.id === 'approvals' ? pendingApprovalCount : 0;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${isActive
                  ? 'bg-[#A57865] text-white'
                  : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {badgeCount > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${isActive ? 'bg-white text-[#A57865]' : 'bg-red-500 text-white'
                    }`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
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

            {/* Engine Stats Footer */}
            <EngineStats compact />
          </>
        )}

        {activeTab === 'alerts' && (
          <AlertsPanel />
        )}

        {activeTab === 'goals' && (
          <GoalsPanel />
        )}

        {activeTab === 'categories' && (
          <CategoryManager />
        )}

        {activeTab === 'approvals' && (
          <ApprovalQueue />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Auto-Reply Engine */}
            <AutoReplies settings={settings} onSettingsChange={updateSettings} />

            {/* Templates Manager */}
            <TemplatesManager />

            {/* Engine Stats (full version) */}
            <EngineStats />
          </div>
        )}
      </div>

      {/* Review Detail Drawer */}
      {selectedReview && (
        <ReviewDetailDrawer
          review={selectedReview}
          onClose={handleCloseDrawer}
          onRespond={handleRespondToReview}
          guestCRMData={{
            totalStays: selectedReview.guest_stays || 1,
            ltv: selectedReview.guest_ltv || 50000,
            segment: selectedReview.guest_segment || 'Leisure'
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
