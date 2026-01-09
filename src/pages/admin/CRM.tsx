import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  RefreshCw,
  Download,
  Plus,
  TrendingUp,
  Award,
  Send,
  Target,
  DollarSign,
  BarChart2,
  Loader2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useToast } from '../../contexts/ToastContext';
import {
  exportSegmentsToCSV,
  exportGuestsToCSV,
  exportCampaignsToCSV,
  generateLTVTrendData,
  generateStayFrequencyData,
  DEFAULT_LOYALTY_TIERS
} from '../../utils/crm';
import {
  sampleCampaigns,
  sampleTemplates
} from '../../data/crmData';
import crmAIService, { CRMGuest, CRMSegment, CRMStats, CampaignSuggestion } from '../../api/services/crm-ai.service';
import { generateId } from '../../utils/crm';

// Components
import SegmentList from '../../components/crm/SegmentList';
import CreateSegmentModal from '../../components/crm/CreateSegmentModal';
import LoyaltyTiers from '../../components/crm/LoyaltyTiers';
import TemplateCenter from '../../components/crm/TemplateCenter';
import CRMTabCampaigns from '../../components/crm/CRMTabCampaigns';
import CRMInsights from '../../components/crm/CRMInsights';
import AISuggestions from '../../components/crm/AISuggestions';

// Storage keys for campaigns and templates (still use localStorage for these)
const CAMPAIGNS_STORAGE_KEY = 'glimmora_crm_campaigns';
const TEMPLATES_STORAGE_KEY = 'glimmora_crm_templates';
const TIERS_STORAGE_KEY = 'glimmora_crm_tiers';

function loadFromStorage(key: string, defaultValue: any) {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn(`Failed to load ${key} from localStorage:`, e);
  }
  return defaultValue;
}

function saveToStorage(key: string, data: any) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export default function CRM() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Real API Data State
  const [guests, setGuests] = useState<CRMGuest[]>([]);
  const [segments, setSegments] = useState<CRMSegment[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local Storage Data (campaigns, templates, tiers)
  const [campaigns, setCampaigns] = useState(() => loadFromStorage(CAMPAIGNS_STORAGE_KEY, sampleCampaigns));
  const [templates, setTemplates] = useState(() => loadFromStorage(TEMPLATES_STORAGE_KEY, sampleTemplates));
  const [loyaltyTiers, setLoyaltyTiers] = useState(() => loadFromStorage(TIERS_STORAGE_KEY, DEFAULT_LOYALTY_TIERS));

  // UI State
  const [activeTab, setActiveTab] = useState('segments');
  const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);

  // Fetch real data from API
  const fetchCRMData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [guestsData, segmentsData, statsData] = await Promise.all([
        crmAIService.getCRMGuests(1, 500),
        crmAIService.getCRMSegments(),
        crmAIService.getCRMStats()
      ]);
      setGuests(guestsData.guests);
      setSegments(segmentsData.segments);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch CRM data:', error);
      showToast('Failed to load CRM data from server', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch data on mount
  useEffect(() => {
    fetchCRMData();
  }, [fetchCRMData]);

  // Persist campaigns, templates, tiers to localStorage
  useEffect(() => { saveToStorage(CAMPAIGNS_STORAGE_KEY, campaigns); }, [campaigns]);
  useEffect(() => { saveToStorage(TEMPLATES_STORAGE_KEY, templates); }, [templates]);
  useEffect(() => { saveToStorage(TIERS_STORAGE_KEY, loyaltyTiers); }, [loyaltyTiers]);

  // Computed KPIs (use API stats when available)
  const kpis = useMemo(() => {
    if (stats) {
      return {
        totalGuests: stats.totalGuests,
        repeatGuests: stats.repeatGuests,
        avgLTV: stats.avgLTV,
        loyaltyCount: stats.loyaltyMembers,
        activeSegments: segments.length,
        engagementRate: stats.engagementRate
      };
    }
    // Fallback to calculated values
    return {
      totalGuests: guests.length,
      repeatGuests: guests.filter(g => g.totalStays > 1).length,
      avgLTV: guests.length > 0 ? guests.reduce((sum, g) => sum + g.totalRevenue, 0) / guests.length : 0,
      loyaltyCount: guests.filter(g => g.loyaltyTier).length,
      activeSegments: segments.length,
      engagementRate: 44
    };
  }, [guests, segments, stats]);

  // Chart data
  const ltvTrendData = useMemo(() => generateLTVTrendData(guests), [guests]);
  const frequencyData = useMemo(() => generateStayFrequencyData(guests), [guests]);

  // Handlers
  const handleRefresh = async () => {
    showToast('Syncing CRM data...', 'info');
    await fetchCRMData();
    showToast('CRM data synced successfully', 'success');
  };

  const handleExportCSV = () => {
    let result;
    switch (activeTab) {
      case 'segments':
        result = exportSegmentsToCSV(segments);
        break;
      case 'campaigns':
        result = exportCampaignsToCSV(campaigns);
        break;
      default:
        result = exportGuestsToCSV(guests);
    }
    if (result.success) {
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  };

  const handleCreateSegment = (segment) => {
    setSegments(prev => [...prev, segment]);
    showToast('Segment created successfully', 'success');
  };

  const handleViewSegment = (segment) => {
    navigate(`/admin/crm/segment/${segment.id}`);
  };

  const handleSaveTiers = (newTiers) => {
    setLoyaltyTiers(newTiers);
    showToast('Loyalty tiers updated', 'success');
  };

  const handleDeleteTier = (tierId) => {
    setLoyaltyTiers(prev => prev.filter(t => t.id !== tierId));
    showToast('Tier deleted', 'success');
  };

  const handleSaveTemplates = (newTemplates) => {
    setTemplates(newTemplates);
  };

  const handleDeleteTemplate = (templateId) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
    showToast('Template deleted', 'success');
  };

  const handleSaveCampaigns = (newCampaigns) => {
    setCampaigns(newCampaigns);
  };

  const handleDeleteCampaign = (campaignId) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
    showToast('Campaign deleted', 'success');
  };

  // Handler for creating campaigns from AI suggestions
  const handleCreateCampaignFromSuggestion = (suggestion: CampaignSuggestion) => {
    const channelMap: Record<string, string> = {
      'email': 'Email',
      'sms': 'SMS',
      'push': 'Push Notification',
      'whatsapp': 'WhatsApp'
    };

    const typeMap: Record<string, string> = {
      'win_back': 'Win-Back',
      'loyalty': 'Loyalty',
      'upsell': 'Upsell',
      'direct_booking': 'Direct Booking',
      'retention': 'Retention',
      'engagement': 'Engagement'
    };

    const newCampaign = {
      id: generateId(),
      name: suggestion.title,
      type: typeMap[suggestion.type] || suggestion.type,
      status: 'draft',
      channel: channelMap[suggestion.best_channel.toLowerCase()] || suggestion.best_channel,
      targetSegment: 'All Guests',
      targetCount: suggestion.target_count,
      scheduledDate: null,
      subject: suggestion.title,
      content: `${suggestion.description}\n\nRecommended Offer: ${suggestion.recommended_offer}\nEstimated Impact: ${suggestion.estimated_impact}`,
      sentCount: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      createdAt: new Date().toISOString(),
      aiGenerated: true,
      priority: suggestion.priority
    };

    setCampaigns(prev => [...prev, newCampaign]);
    showToast(`Campaign "${suggestion.title}" created from AI suggestion`, 'success');
    setActiveTab('campaigns');
  };

  // Handler for AI action items
  const handleAIActionClick = (action: any) => {
    showToast(`Action: ${action.title}`, 'info');
    // Could navigate to relevant section based on action type
    if (action.action_type === 'campaign') {
      setActiveTab('campaigns');
    } else if (action.action_type === 'segment') {
      setActiveTab('segments');
    }
  };

  const tabs = [
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'loyalty', label: 'Loyalty Tiers', icon: Award },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'templates', label: 'Templates', icon: BarChart2 }
  ];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#A57865] mx-auto mb-4" />
          <p className="text-neutral-600">Loading CRM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-50 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            CRM & Loyalty
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Guest segmentation, loyalty performance and communication tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateSegmentModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#A57865] text-white rounded-xl text-sm font-medium hover:bg-[#8E6554] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Segment
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#A57865]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#A57865]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{kpis.totalGuests.toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1">Total Guests</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 text-[#4E5840]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{kpis.repeatGuests}</p>
          <p className="text-xs text-neutral-500 mt-1">Repeat Guests</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#CDB261]/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#CDB261]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#4E5840]">${kpis.avgLTV.toLocaleString()}</p>
          <p className="text-xs text-neutral-500 mt-1">Avg LTV</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-[#5C9BA4]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{kpis.loyaltyCount}</p>
          <p className="text-xs text-neutral-500 mt-1">Loyalty Members</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#8E6554]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#8E6554]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{kpis.activeSegments}</p>
          <p className="text-xs text-neutral-500 mt-1">Active Segments</p>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#4E5840]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#4E5840]">{kpis.engagementRate}%</p>
          <p className="text-xs text-neutral-500 mt-1">Engagement Rate</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LTV Trend */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">LTV Trend</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ltvTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Avg LTV']}
                />
                <Line
                  type="monotone"
                  dataKey="ltv"
                  stroke="#A57865"
                  strokeWidth={2}
                  dot={{ fill: '#A57865' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stay Frequency */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">Stay Frequency Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} stroke="#6B7280" />
                <YAxis tick={{ fontSize: 11 }} stroke="#6B7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #E5E5E5',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#4E5840" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#A57865] border-[#A57865]'
                    : 'text-neutral-500 border-transparent hover:text-neutral-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - Full Width */}
      <div>
        {activeTab === 'segments' && (
          <SegmentList
            segments={segments}
            onViewSegment={handleViewSegment}
            onCreateSegment={() => setShowCreateSegmentModal(true)}
          />
        )}

        {activeTab === 'loyalty' && (
          <LoyaltyTiers
            tiers={loyaltyTiers}
            guests={guests}
            onSave={handleSaveTiers}
            onDelete={handleDeleteTier}
          />
        )}

        {activeTab === 'campaigns' && (
          <CRMTabCampaigns
            campaigns={campaigns}
            segments={segments}
            templates={templates}
            onSave={handleSaveCampaigns}
            onDelete={handleDeleteCampaign}
          />
        )}

        {activeTab === 'templates' && (
          <TemplateCenter
            templates={templates}
            onSave={handleSaveTemplates}
            onDelete={handleDeleteTemplate}
          />
        )}
      </div>

      {/* AI Suggestions & CRM Insights Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* AI Suggestions - Connected to campaign creation */}
        <AISuggestions
          onCreateCampaign={handleCreateCampaignFromSuggestion}
          onActionClick={handleAIActionClick}
        />

        {/* CRM Insights */}
        <CRMInsights
          guests={guests}
          segments={segments}
          campaigns={campaigns}
          tiers={loyaltyTiers}
        />
      </div>

      {/* Create Segment Modal */}
      <CreateSegmentModal
        isOpen={showCreateSegmentModal}
        onClose={() => setShowCreateSegmentModal(false)}
        onSave={handleCreateSegment}
        guests={guests}
        loyaltyTiers={loyaltyTiers}
      />
    </div>
  );
}
