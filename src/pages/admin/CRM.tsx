import { useState, useMemo, useEffect } from 'react';
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
  BarChart2
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
  calculateAverageLTV,
  calculateRepeatGuests,
  calculateEngagementRate,
  countByLoyaltyTier,
  exportSegmentsToCSV,
  exportGuestsToCSV,
  exportCampaignsToCSV,
  generateLTVTrendData,
  generateStayFrequencyData,
  DEFAULT_LOYALTY_TIERS
} from '../../utils/crm';
import {
  sampleGuests,
  sampleSegments,
  sampleCampaigns,
  sampleTemplates
} from '../../data/crmData';

// Components
import SegmentList from '../../components/crm/SegmentList';
import CreateSegmentModal from '../../components/crm/CreateSegmentModal';
import LoyaltyTiers from '../../components/crm/LoyaltyTiers';
import TemplateCenter from '../../components/crm/TemplateCenter';
import CRMTabCampaigns from '../../components/crm/CRMTabCampaigns';
import CRMInsights from '../../components/crm/CRMInsights';

// Storage keys
const GUESTS_STORAGE_KEY = 'glimmora_crm_guests';
const SEGMENTS_STORAGE_KEY = 'glimmora_crm_segments';
const CAMPAIGNS_STORAGE_KEY = 'glimmora_crm_campaigns';
const TEMPLATES_STORAGE_KEY = 'glimmora_crm_templates';
const TIERS_STORAGE_KEY = 'glimmora_crm_tiers';

function loadFromStorage(key, defaultValue) {
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

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage:`, e);
  }
}

export default function CRM() {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // State
  const [guests, setGuests] = useState(() => loadFromStorage(GUESTS_STORAGE_KEY, sampleGuests));
  const [segments, setSegments] = useState(() => loadFromStorage(SEGMENTS_STORAGE_KEY, sampleSegments));
  const [campaigns, setCampaigns] = useState(() => loadFromStorage(CAMPAIGNS_STORAGE_KEY, sampleCampaigns));
  const [templates, setTemplates] = useState(() => loadFromStorage(TEMPLATES_STORAGE_KEY, sampleTemplates));
  const [loyaltyTiers, setLoyaltyTiers] = useState(() => loadFromStorage(TIERS_STORAGE_KEY, DEFAULT_LOYALTY_TIERS));

  // UI State
  const [activeTab, setActiveTab] = useState('segments');
  const [showCreateSegmentModal, setShowCreateSegmentModal] = useState(false);

  // Persist to localStorage
  useEffect(() => { saveToStorage(GUESTS_STORAGE_KEY, guests); }, [guests]);
  useEffect(() => { saveToStorage(SEGMENTS_STORAGE_KEY, segments); }, [segments]);
  useEffect(() => { saveToStorage(CAMPAIGNS_STORAGE_KEY, campaigns); }, [campaigns]);
  useEffect(() => { saveToStorage(TEMPLATES_STORAGE_KEY, templates); }, [templates]);
  useEffect(() => { saveToStorage(TIERS_STORAGE_KEY, loyaltyTiers); }, [loyaltyTiers]);

  // Computed KPIs
  const kpis = useMemo(() => {
    const tierCounts = countByLoyaltyTier(guests, loyaltyTiers);
    const totalTierGuests = Object.values(tierCounts).reduce((a, b) => a + b, 0);

    return {
      totalGuests: guests.length,
      repeatGuests: calculateRepeatGuests(guests),
      avgLTV: calculateAverageLTV(guests),
      loyaltyCount: totalTierGuests,
      activeSegments: segments.length,
      engagementRate: calculateEngagementRate(campaigns)
    };
  }, [guests, segments, campaigns, loyaltyTiers]);

  // Chart data
  const ltvTrendData = useMemo(() => generateLTVTrendData(guests), [guests]);
  const frequencyData = useMemo(() => generateStayFrequencyData(guests), [guests]);

  // Handlers
  const handleRefresh = () => {
    showToast('Syncing CRM data...', 'info');
    setTimeout(() => {
      showToast('CRM data synced successfully', 'success');
    }, 1500);
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

  const tabs = [
    { id: 'segments', label: 'Segments', icon: Target },
    { id: 'loyalty', label: 'Loyalty Tiers', icon: Award },
    { id: 'campaigns', label: 'Campaigns', icon: Send },
    { id: 'templates', label: 'Templates', icon: BarChart2 }
  ];

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

      {/* CRM Insights - Below Row */}
      <div>
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
