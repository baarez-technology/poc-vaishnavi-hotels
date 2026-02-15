import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Send,
  Plus,
  Edit2,
  Trash2,
  X,
  Mail,
  MessageSquare,
  Bell,
  Calendar,
  Users,
  Play,
  Pause,
  BarChart2,
  Sparkles,
  Brain,
  Wand2,
  TrendingUp,
  Clock,
  Target,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Lightbulb,
  Zap
} from 'lucide-react';
import { generateId, formatDate, CAMPAIGN_TYPES, CAMPAIGN_STATUS } from '../../utils/crm';
import CustomDropdown from '../ui/CustomDropdown';
import { crmAIService, CampaignRecommendations, CampaignSuggestion, AISuggestions } from '../../api/services/crm-ai.service';

const CAMPAIGN_TYPE_OPTIONS = CAMPAIGN_TYPES.map(type => ({
  value: type.id,
  label: `${type.icon} ${type.name}`
}));

const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' }
];

// Priority badge colors
const PRIORITY_COLORS = {
  high: { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200' },
  medium: { bg: 'bg-[#CDB261]/20', text: 'text-[#CDB261]', border: 'border-[#CDB261]/30' },
  low: { bg: 'bg-[#5C9BA4]/20', text: 'text-[#5C9BA4]', border: 'border-[#5C9BA4]/30' }
};

// AI Subject Line Suggestions Component
function AISubjectLineSuggestions({ suggestions, onSelect, isLoading }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="mt-2 p-3 bg-gradient-to-r from-[#4E5840]/5 to-[#5C9BA4]/5 rounded-lg border border-[#4E5840]/10">
        <div className="flex items-center gap-2 text-sm text-neutral-600">
          <Loader2 className="w-4 h-4 animate-spin text-[#4E5840]" />
          <span>Generating AI suggestions...</span>
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-gradient-to-r from-[#4E5840]/5 to-[#5C9BA4]/5 rounded-lg border border-[#4E5840]/10">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-[#4E5840] hover:text-[#3d4632] transition-colors w-full"
      >
        <Sparkles className="w-4 h-4" />
        <span>AI Subject Line Suggestions</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 ml-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-auto" />
        )}
      </button>
      {isExpanded && (
        <div className="mt-3 space-y-2">
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelect(suggestion)}
              className="w-full text-left px-3 py-2 text-sm text-neutral-700 bg-white rounded-lg border border-neutral-200 hover:border-[#A57865] hover:bg-[#A57865]/5 transition-all"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// AI Predictions Display Component
function AIPredictions({ openRate, clickRate, optimalSendTime, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-[#5C9BA4]/10 to-[#4E5840]/10 rounded-xl p-4 border border-[#5C9BA4]/20">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-[#5C9BA4]" />
          <span className="text-sm text-neutral-600">Analyzing campaign performance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#5C9BA4]/10 to-[#4E5840]/10 rounded-xl p-4 border border-[#5C9BA4]/20">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-[#5C9BA4]" />
        <h4 className="text-sm font-semibold text-neutral-800">AI Performance Predictions</h4>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <p className="text-lg font-bold text-[#4E5840]">{openRate}%</p>
          <p className="text-xs text-neutral-500">Predicted Open Rate</p>
        </div>
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <p className="text-lg font-bold text-[#5C9BA4]">{clickRate}%</p>
          <p className="text-xs text-neutral-500">Predicted Click Rate</p>
        </div>
        <div className="text-center p-2 bg-white/60 rounded-lg">
          <div className="flex items-center justify-center gap-1">
            <Clock className="w-4 h-4 text-[#CDB261]" />
            <p className="text-sm font-semibold text-[#CDB261]">{optimalSendTime}</p>
          </div>
          <p className="text-xs text-neutral-500">Best Send Time</p>
        </div>
      </div>
    </div>
  );
}

// AI Recommended Segments Component
function AIRecommendedSegments({ campaignType, segments, selectedSegmentId, onSelect }) {
  const getRecommendedSegments = () => {
    // AI logic to recommend segments based on campaign type
    const segmentScores = segments.map(seg => {
      let score = 0;
      const name = seg.name?.toLowerCase() || '';

      switch (campaignType) {
        case 'win_back':
          if (name.includes('inactive') || name.includes('lapsed') || name.includes('churned')) score += 3;
          if (name.includes('high value') || name.includes('vip')) score += 2;
          break;
        case 'loyalty':
          if (name.includes('repeat') || name.includes('loyal') || name.includes('vip')) score += 3;
          if (name.includes('gold') || name.includes('platinum')) score += 2;
          break;
        case 'upsell':
          if (name.includes('active') || name.includes('recent')) score += 2;
          if (name.includes('high value')) score += 3;
          break;
        case 'direct_booking':
          if (name.includes('ota') || name.includes('booking.com') || name.includes('expedia')) score += 3;
          break;
        default:
          score = 1;
      }

      return { ...seg, aiScore: score };
    });

    return segmentScores
      .filter(s => s.aiScore > 0)
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, 3);
  };

  const recommendedSegments = getRecommendedSegments();

  if (recommendedSegments.length === 0) return null;

  return (
    <div className="mt-3 p-3 bg-[#CDB261]/10 rounded-lg border border-[#CDB261]/20">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-[#CDB261]" />
        <span className="text-xs font-medium text-[#CDB261] uppercase tracking-wide">AI Recommended Segments</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {recommendedSegments.map(seg => (
          <button
            key={seg.id}
            type="button"
            onClick={() => onSelect(seg.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              selectedSegmentId === seg.id
                ? 'bg-[#4E5840] text-white'
                : 'bg-white text-neutral-700 border border-neutral-200 hover:border-[#4E5840] hover:bg-[#4E5840]/5'
            }`}
          >
            {seg.name} ({seg.guestCount || 0})
          </button>
        ))}
      </div>
    </div>
  );
}

function CampaignModal({ isOpen, onClose, onSave, campaign, mode, segments, templates, aiSuggestion }) {
  const [formData, setFormData] = useState({
    name: campaign?.name || aiSuggestion?.title || '',
    type: campaign?.type || 'email',
    status: campaign?.status || 'draft',
    segmentId: campaign?.segmentId || '',
    templateId: campaign?.templateId || '',
    subject: campaign?.subject || '',
    scheduleDate: campaign?.scheduleDate || ''
  });

  const [aiSubjectSuggestions, setAiSubjectSuggestions] = useState<string[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [aiPredictions, setAiPredictions] = useState({
    openRate: 0,
    clickRate: 0,
    optimalSendTime: '10:00 AM'
  });
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);

  const selectedSegment = segments.find(s => s.id === formData.segmentId);
  const filteredTemplates = templates.filter(t => t.type === formData.type);

  // Fetch AI predictions when segment changes
  useEffect(() => {
    if (formData.segmentId && formData.type) {
      setIsLoadingPredictions(true);
      // Simulate AI prediction based on segment data
      const timeout = setTimeout(() => {
        const segment = segments.find(s => s.id === formData.segmentId);
        const baseOpenRate = segment?.repeatRate ? Math.min(35 + segment.repeatRate * 0.3, 55) : 25;
        const baseClickRate = baseOpenRate * 0.35;
        const hours = [9, 10, 11, 14, 15, 16];
        const optimalHour = hours[Math.floor(Math.random() * hours.length)];

        setAiPredictions({
          openRate: Math.round(baseOpenRate + Math.random() * 10),
          clickRate: Math.round(baseClickRate + Math.random() * 5),
          optimalSendTime: `${optimalHour}:00 ${optimalHour < 12 ? 'AM' : 'PM'}`
        });
        setIsLoadingPredictions(false);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [formData.segmentId, formData.type, segments]);

  // Generate AI subject line suggestions
  const generateSubjectLines = useCallback(async () => {
    setIsLoadingSubjects(true);
    try {
      // Simulate AI generation - in production, this would call an AI endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));

      const campaignName = formData.name || 'your campaign';
      const segmentName = selectedSegment?.name || 'guests';

      const suggestions = [
        `Exclusive offer just for you, ${segmentName}!`,
        `We miss you! Come back to Glimmora`,
        `${campaignName}: Special rates inside`,
        `Your VIP invitation awaits`,
        `Limited time: ${Math.floor(Math.random() * 20 + 10)}% off your next stay`
      ];

      setAiSubjectSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to generate subject lines:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  }, [formData.name, selectedSegment]);

  // ESC key handler and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Sync form data when modal opens or campaign/aiSuggestion changes (fixes edit mode showing empty)
  useEffect(() => {
    if (isOpen) {
      if (campaign) {
        setFormData({
          name: campaign.name || '',
          type: campaign.type || 'email',
          status: campaign.status || 'draft',
          segmentId: campaign.segmentId || '',
          templateId: campaign.templateId || '',
          subject: campaign.subject || '',
          scheduleDate: campaign.scheduleDate || ''
        });
      } else {
        setFormData({
          name: aiSuggestion?.title || '',
          type: 'email',
          status: 'draft',
          segmentId: '',
          templateId: '',
          subject: '',
          scheduleDate: ''
        });
      }
    }
  }, [isOpen, campaign, aiSuggestion]);

  // Pre-fill from AI suggestion (when suggestion changes while modal is open)
  useEffect(() => {
    if (aiSuggestion && mode === 'create') {
      setFormData(prev => ({
        ...prev,
        name: aiSuggestion.title || prev.name
      }));
    }
  }, [aiSuggestion, mode]);

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.segmentId) return;

    const campaignData = {
      id: campaign?.id || generateId(),
      name: formData.name.trim(),
      type: formData.type,
      status: formData.status,
      segmentId: formData.segmentId,
      segmentName: selectedSegment?.name || '',
      templateId: formData.templateId,
      subject: formData.subject.trim(),
      scheduleDate: formData.scheduleDate || null,
      aiPredictions: {
        openRate: aiPredictions.openRate,
        clickRate: aiPredictions.clickRate,
        optimalSendTime: aiPredictions.optimalSendTime
      },
      metrics: campaign?.metrics || {
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0
      },
      createdAt: campaign?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(campaignData);
    onClose();
  };

  if (!isOpen) return null;

  const segmentOptions = [
    { value: '', label: 'Select a segment...' },
    ...segments.map(seg => ({
      value: seg.id,
      label: `${seg.name} (${seg.guestCount || 0} guests)`
    }))
  ];

  const templateOptions = [
    { value: '', label: 'Select a template...' },
    ...filteredTemplates.map(tmpl => ({
      value: tmpl.id,
      label: tmpl.name
    }))
  ];

  const modalContent = (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Right-side Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 w-full sm:max-w-lg flex flex-col bg-white border-l border-neutral-200 shadow-2xl h-screen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 pr-12 sm:pr-14 border-b border-neutral-100 bg-white flex-shrink-0 z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-semibold text-neutral-900">
                {mode === 'create' ? 'Create Campaign' : 'Edit Campaign'}
              </h2>
              {aiSuggestion && (
                <span className="px-2 py-0.5 bg-[#4E5840]/10 text-[#4E5840] text-[10px] sm:text-xs font-medium rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Suggested
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-neutral-500">Configure campaign settings</p>
          </div>
          <button
            onClick={onClose}
            className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 bg-white space-y-4">
          <div>
            <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Holiday Season Promotion"
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Type</label>
              <CustomDropdown
                options={CAMPAIGN_TYPE_OPTIONS}
                value={formData.type}
                onChange={(value) => setFormData(prev => ({ ...prev, type: value, templateId: '' }))}
                className="w-full"
              />
            </div>
            <div>
              <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Status</label>
              <CustomDropdown
                options={CAMPAIGN_STATUS_OPTIONS}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Target Segment *</label>
            <CustomDropdown
              options={segmentOptions}
              value={formData.segmentId}
              onChange={(value) => setFormData(prev => ({ ...prev, segmentId: value }))}
              className="w-full"
            />
            {/* AI Recommended Segments */}
            {aiSuggestion?.type && (
              <AIRecommendedSegments
                campaignType={aiSuggestion.type}
                segments={segments}
                selectedSegmentId={formData.segmentId}
                onSelect={(segmentId) => setFormData(prev => ({ ...prev, segmentId }))}
              />
            )}
          </div>

          <div>
            <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Message Template</label>
            <CustomDropdown
              options={templateOptions}
              value={formData.templateId}
              onChange={(value) => setFormData(prev => ({ ...prev, templateId: value }))}
              className="w-full"
            />
          </div>

          {formData.type === 'email' && (
            <div>
              <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide">Subject Line</label>
                <button
                  type="button"
                  onClick={generateSubjectLines}
                  disabled={isLoadingSubjects}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-medium text-[#4E5840] bg-[#4E5840]/10 rounded-lg hover:bg-[#4E5840]/20 transition-colors disabled:opacity-50"
                >
                  <Wand2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Generate with AI</span>
                  <span className="sm:hidden">AI</span>
                </button>
              </div>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Email subject..."
                className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
              />
              <AISubjectLineSuggestions
                suggestions={aiSubjectSuggestions}
                onSelect={(subject) => setFormData(prev => ({ ...prev, subject }))}
                isLoading={isLoadingSubjects}
              />
            </div>
          )}

          <div>
            <label className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1.5 sm:mb-2 block">Schedule Date</label>
            <input
              type="datetime-local"
              value={formData.scheduleDate}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduleDate: e.target.value }))}
              min={(() => {
                const n = new Date();
                return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}T${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
              })()}
              className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]/20 focus:border-[#A57865]"
            />
          </div>

          {/* AI Predictions */}
          {selectedSegment && (
            <AIPredictions
              openRate={aiPredictions.openRate}
              clickRate={aiPredictions.clickRate}
              optimalSendTime={aiPredictions.optimalSendTime}
              isLoading={isLoadingPredictions}
            />
          )}

          {selectedSegment && (
            <div className="bg-neutral-50 rounded-xl p-3 sm:p-4 border border-neutral-200">
              <h4 className="text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 sm:mb-3">Target Audience</h4>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-[#A57865]">{selectedSegment.guestCount || 0}</p>
                  <p className="text-[10px] sm:text-xs text-neutral-500">Recipients</p>
                </div>
                <div className="text-center">
                  <p className="text-lg sm:text-xl font-bold text-[#4E5840]">${(selectedSegment.avgRevenue || 0).toLocaleString()}</p>
                  <p className="text-[10px] sm:text-xs text-neutral-500">Avg LTV</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-neutral-100 px-4 sm:px-6 py-4 sm:py-5 bg-neutral-50/50">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-xs sm:text-sm font-medium hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || !formData.segmentId}
              className={`flex-1 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                formData.name.trim() && formData.segmentId
                  ? 'bg-[#4E5840] text-white hover:bg-[#3d4632]'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {mode === 'create' ? 'Create Campaign' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

// AI Recommendations Panel Component
function AIRecommendationsPanel({ onCreateCampaign, isLoading, error, recommendations, onRetry }) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (error) {
    return (
      <div className="mb-5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <div>
              <p className="text-sm font-medium text-rose-800">Failed to load AI recommendations</p>
              <p className="text-xs text-rose-600 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-100 rounded-lg hover:bg-rose-200 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-5 p-6 bg-gradient-to-r from-[#4E5840]/5 via-[#5C9BA4]/5 to-[#CDB261]/5 border border-[#4E5840]/10 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#4E5840] animate-spin" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-700">Analyzing guest data...</p>
            <p className="text-xs text-neutral-500">AI is generating campaign recommendations</p>
          </div>
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="mb-5 bg-gradient-to-r from-[#4E5840]/5 via-[#5C9BA4]/5 to-[#CDB261]/5 border border-[#4E5840]/10 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#4E5840] to-[#5C9BA4] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              AI Campaign Recommendations
              <span className="px-2 py-0.5 bg-[#4E5840] text-white text-xs rounded-full">{recommendations.length}</span>
            </h3>
            <p className="text-xs text-neutral-500">Personalized suggestions based on guest intelligence</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-neutral-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-neutral-400" />
        )}
      </button>

      {/* Recommendations List */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3">
          {recommendations.map((rec, idx) => {
            const priorityStyle = PRIORITY_COLORS[rec.priority] || PRIORITY_COLORS.medium;

            return (
              <div
                key={rec.id || idx}
                className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-[#A57865]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-neutral-900">{rec.title}</h4>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-3">{rec.description}</p>

                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#A57865]" />
                        {rec.target_count} guests
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#4E5840]" />
                        {rec.estimated_impact}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#CDB261]" />
                        {rec.best_channel}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onCreateCampaign(rec)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-[#A57865] text-white text-sm font-medium rounded-lg hover:bg-[#A57865]/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// AI Insights Badge for Campaign Card
function CampaignAIInsights({ campaign, isExpanded, onToggle }) {
  // Generate AI insights based on campaign data
  const getPerformancePrediction = () => {
    const metrics = campaign.metrics || {};
    const openRate = metrics.sent > 0 ? (metrics.opened / metrics.sent) * 100 : 0;

    if (openRate > 30) return { label: 'Excellent', color: 'text-[#4E5840]', bgColor: 'bg-[#4E5840]/10' };
    if (openRate > 20) return { label: 'Good', color: 'text-[#5C9BA4]', bgColor: 'bg-[#5C9BA4]/10' };
    if (openRate > 10) return { label: 'Average', color: 'text-[#CDB261]', bgColor: 'bg-[#CDB261]/10' };
    return { label: 'Needs Optimization', color: 'text-[#A57865]', bgColor: 'bg-[#A57865]/10' };
  };

  const getOptimalSendTime = () => {
    // AI-generated optimal send time based on segment analysis
    const times = ['9:00 AM', '10:30 AM', '2:00 PM', '4:30 PM'];
    return campaign.aiPredictions?.optimalSendTime || times[Math.floor(Math.random() * times.length)];
  };

  const getSubjectSuggestions = () => {
    return [
      `${campaign.name} - Special Offer Inside`,
      `Exclusive: Your personalized deal awaits`,
      `Don't miss out: Limited time offer`
    ];
  };

  const prediction = getPerformancePrediction();
  const subjectSuggestions = getSubjectSuggestions();

  return (
    <div className="mt-3 pt-3 border-t border-neutral-100">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-xs text-[#5C9BA4] hover:text-[#4a8a94] transition-colors"
      >
        <span className="flex items-center gap-1.5 font-medium">
          <Brain className="w-3.5 h-3.5" />
          AI Insights
        </span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Performance Prediction */}
          <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
            <span className="text-xs text-neutral-600 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
              Predicted Performance
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${prediction.bgColor} ${prediction.color}`}>
              {prediction.label}
            </span>
          </div>

          {/* Optimal Send Time */}
          <div className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
            <span className="text-xs text-neutral-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Optimal Send Time
            </span>
            <span className="text-xs font-medium text-[#CDB261]">{getOptimalSendTime()}</span>
          </div>

          {/* Subject Line Suggestions */}
          <div className="p-2 bg-[#4E5840]/5 rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-[#4E5840]" />
              <span className="text-xs font-medium text-[#4E5840]">Subject Line Suggestions</span>
            </div>
            <div className="space-y-1">
              {subjectSuggestions.slice(0, 2).map((suggestion, idx) => (
                <p key={idx} className="text-xs text-neutral-600 truncate" title={suggestion}>
                  {idx + 1}. {suggestion}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CRMTabCampaigns({ campaigns, segments, templates, onSave, onDelete }) {
  const [modalState, setModalState] = useState({ isOpen: false, campaign: null, mode: 'create', aiSuggestion: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filter, setFilter] = useState('all');
  const [expandedInsights, setExpandedInsights] = useState<Record<string, boolean>>({});

  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<CampaignSuggestion[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(true);
  const [aiError, setAiError] = useState<string | null>(null);

  // Fetch AI recommendations on mount
  const fetchAIRecommendations = useCallback(async () => {
    setIsLoadingAI(true);
    setAiError(null);

    try {
      const suggestions = await crmAIService.getAISuggestions();
      setAiRecommendations(suggestions.campaign_suggestions || []);
    } catch (error) {
      console.error('Failed to fetch AI recommendations:', error);
      setAiError(error instanceof Error ? error.message : 'Failed to load AI recommendations');

      // Fallback mock data for development
      setAiRecommendations([
        {
          id: 'ai-1',
          title: 'Win-Back Inactive VIP Guests',
          description: 'Target 23 high-value guests who haven\'t booked in 6+ months with a personalized re-engagement offer.',
          priority: 'high',
          type: 'win_back',
          target_count: 23,
          estimated_impact: '15% conversion',
          recommended_offer: '20% discount',
          best_channel: 'Email',
          icon: 'users'
        },
        {
          id: 'ai-2',
          title: 'Loyalty Tier Upgrade Campaign',
          description: 'Encourage 45 Silver members close to Gold status with a booking incentive.',
          priority: 'medium',
          type: 'loyalty',
          target_count: 45,
          estimated_impact: '25% upgrade rate',
          recommended_offer: 'Bonus nights',
          best_channel: 'Email',
          icon: 'star'
        },
        {
          id: 'ai-3',
          title: 'Direct Booking Conversion',
          description: 'Convert OTA bookers to direct with exclusive member benefits.',
          priority: 'medium',
          type: 'direct_booking',
          target_count: 67,
          estimated_impact: '12% conversion',
          recommended_offer: 'Member rate',
          best_channel: 'SMS',
          icon: 'trending-up'
        }
      ]);
    } finally {
      setIsLoadingAI(false);
    }
  }, []);

  useEffect(() => {
    fetchAIRecommendations();
  }, [fetchAIRecommendations]);

  const filteredCampaigns = campaigns.filter(c => filter === 'all' || c.status === filter);

  const handleCreateCampaign = (aiSuggestion = null) => {
    setModalState({ isOpen: true, campaign: null, mode: 'create', aiSuggestion });
  };

  const handleEditCampaign = (campaign) => {
    setModalState({ isOpen: true, campaign, mode: 'edit', aiSuggestion: null });
  };

  const handleSaveCampaign = (campaignData) => {
    if (modalState.mode === 'create') {
      onSave([...campaigns, campaignData]);
    } else {
      onSave(campaigns.map(c => c.id === campaignData.id ? campaignData : c));
    }
  };

  const handleDeleteCampaign = (campaignId) => {
    onDelete(campaignId);
    setDeleteConfirm(null);
  };

  const handleToggleStatus = (campaign) => {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active';
    const updatedCampaign = { ...campaign, status: newStatus, updatedAt: new Date().toISOString() };
    onSave(campaigns.map(c => c.id === campaign.id ? updatedCampaign : c));
  };

  const toggleInsights = (campaignId) => {
    setExpandedInsights(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-[#4E5840]" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-[#5C9BA4]" />;
      case 'push':
        return <Bell className="w-5 h-5 text-[#CDB261]" />;
      default:
        return <Send className="w-5 h-5 text-neutral-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-3 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center flex-shrink-0">
            <Send className="w-4 h-4 sm:w-5 sm:h-5 text-[#4E5840]" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900">Campaigns</h3>
            <p className="text-xs sm:text-sm text-neutral-500">{campaigns.length} campaigns</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <CustomDropdown
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Completed' },
              { value: 'paused', label: 'Paused' }
            ]}
            value={filter}
            onChange={setFilter}
            className="[&_button]:min-w-[90px] sm:[&_button]:min-w-[120px]"
          />
          <button
            onClick={() => handleCreateCampaign()}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#A57865] text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-[#A57865]/90 transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Create Campaign</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* AI Recommendations Panel */}
      <AIRecommendationsPanel
        recommendations={aiRecommendations}
        isLoading={isLoadingAI}
        error={aiError}
        onCreateCampaign={handleCreateCampaign}
        onRetry={fetchAIRecommendations}
      />

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredCampaigns.map((campaign) => {
          const statusConfig = CAMPAIGN_STATUS[campaign.status] || CAMPAIGN_STATUS.draft;
          const metrics = campaign.metrics || {};
          const openRate = metrics.sent > 0 ? Math.round((metrics.opened / metrics.sent) * 100) : 0;
          const clickRate = metrics.opened > 0 ? Math.round((metrics.clicked / metrics.opened) * 100) : 0;

          return (
            <div
              key={campaign.id}
              className="border border-neutral-200 rounded-xl p-4 hover:border-[#A57865]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                    {getTypeIcon(campaign.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral-900">{campaign.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5">
                      <span className={`px-2 py-0.5 rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {campaign.segmentName}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {(campaign.status === 'active' || campaign.status === 'paused') && (
                    <button
                      onClick={() => handleToggleStatus(campaign)}
                      className={`p-2 rounded-lg transition-colors ${
                        campaign.status === 'active'
                          ? 'hover:bg-[#CDB261]/10 text-[#CDB261]'
                          : 'hover:bg-[#4E5840]/10 text-[#4E5840]'
                      }`}
                      title={campaign.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {campaign.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditCampaign(campaign)}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-500" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(campaign.id)}
                    className="p-2 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-rose-500" />
                  </button>
                </div>
              </div>

              {/* Schedule Info */}
              {campaign.scheduleDate && (
                <div className="flex items-center gap-2 text-xs text-neutral-600 mb-3">
                  <Calendar className="w-3 h-3" />
                  Scheduled: {formatDate(campaign.scheduleDate)}
                </div>
              )}

              {/* Metrics */}
              {(campaign.status === 'active' || campaign.status === 'completed') && (
                <div className="grid grid-cols-4 gap-2 bg-neutral-50 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{metrics.sent || 0}</p>
                    <p className="text-xs text-neutral-500">Sent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-neutral-900">{metrics.delivered || 0}</p>
                    <p className="text-xs text-neutral-500">Delivered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#4E5840]">{openRate}%</p>
                    <p className="text-xs text-neutral-500">Open Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-[#5C9BA4]">{clickRate}%</p>
                    <p className="text-xs text-neutral-500">Click Rate</p>
                  </div>
                </div>
              )}

              {/* AI Insights for each campaign */}
              <CampaignAIInsights
                campaign={campaign}
                isExpanded={expandedInsights[campaign.id] || false}
                onToggle={() => toggleInsights(campaign.id)}
              />

              {deleteConfirm === campaign.id && (
                <div className="mt-3 pt-3 border-t border-neutral-100 bg-rose-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <p className="text-sm text-rose-800 mb-2">Delete this campaign?</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="px-3 py-1.5 bg-rose-600 text-white text-xs font-medium rounded-lg hover:bg-rose-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredCampaigns.length === 0 && (
          <div className="text-center py-8">
            <p className="text-neutral-500">No campaigns found</p>
            <button
              onClick={() => handleCreateCampaign()}
              className="mt-2 text-sm text-[#A57865] hover:underline"
            >
              Create your first campaign
            </button>
          </div>
        )}
      </div>

      <CampaignModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, campaign: null, mode: 'create', aiSuggestion: null })}
        onSave={handleSaveCampaign}
        campaign={modalState.campaign}
        mode={modalState.mode}
        segments={segments}
        templates={templates}
        aiSuggestion={modalState.aiSuggestion}
      />
    </div>
  );
}
