import { useState, useEffect } from 'react';
import {
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  AlertCircle,
  Users,
  Mail,
  Globe,
  Star,
  Award,
  RefreshCw,
  Gift,
  MessageCircle,
  Layers,
  ChevronRight,
  Loader2,
  Play,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { crmAIService, AISuggestions as AISuggestionsType, CampaignSuggestion } from '../../api/services/crm-ai.service';

interface AISuggestionsProps {
  onCreateCampaign?: (suggestion: CampaignSuggestion) => void;
  onActionClick?: (action: any) => void;
}

const ICON_MAP: Record<string, any> = {
  globe: Globe,
  refresh: RefreshCw,
  star: Star,
  award: Award,
  activity: TrendingUp,
  crown: Star,
  mail: Mail,
  'trending-up': TrendingUp,
  layers: Layers,
  zap: Zap,
  'message-circle': MessageCircle,
  gift: Gift,
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-rose-100 text-rose-700 border-rose-200';
    case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
  }
};

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case 'high': return 'border-l-rose-500';
    case 'medium': return 'border-l-amber-500';
    case 'low': return 'border-l-emerald-500';
    default: return 'border-l-neutral-300';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return 'bg-emerald-500';
    case 'medium': return 'bg-amber-500';
    case 'low': return 'bg-neutral-400';
    default: return 'bg-neutral-300';
  }
};

export default function AISuggestions({ onCreateCampaign, onActionClick }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestionsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('campaigns');
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await crmAIService.getAISuggestions();
      setSuggestions(data);
    } catch (err) {
      console.error('Failed to fetch AI suggestions:', err);
      setError('Failed to load AI suggestions. Make sure the API is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: CampaignSuggestion) => {
    setAppliedSuggestions(prev => new Set([...prev, suggestion.id]));
    if (onCreateCampaign) {
      onCreateCampaign(suggestion);
    }
  };

  const handleActionClick = (action: any) => {
    if (onActionClick) {
      onActionClick(action);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#A57865]/5 to-[#5C9BA4]/5 rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A57865] to-[#5C9BA4] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">ReConnect AI Suggestions</h3>
            <p className="text-sm text-neutral-500">Analyzing your guest data...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#A57865] animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#A57865]/5 to-[#5C9BA4]/5 rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A57865] to-[#5C9BA4] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">ReConnect AI Suggestions</h3>
            <p className="text-sm text-neutral-500">AI-powered campaign recommendations</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-neutral-700 mb-4">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="flex items-center gap-2 px-4 py-2 bg-[#A57865] text-white rounded-lg text-sm font-medium hover:bg-[#8E6554] transition-colors mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!suggestions) return null;

  const { campaign_suggestions, segment_insights, action_items, quick_wins } = suggestions;

  return (
    <div className="bg-gradient-to-br from-[#A57865]/5 to-[#5C9BA4]/5 rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-neutral-200 bg-white/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#A57865] to-[#5C9BA4] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900">ReConnect AI Suggestions</h3>
              <p className="text-sm text-neutral-500">
                Based on {suggestions.analyzed_guests} guests analyzed
              </p>
            </div>
          </div>
          <button
            onClick={fetchSuggestions}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            title="Refresh suggestions"
          >
            <RefreshCw className="w-4 h-4 text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-200 bg-white/30">
        {[
          { id: 'campaigns', label: 'Campaigns', count: campaign_suggestions.length, icon: Target },
          { id: 'insights', label: 'Insights', count: segment_insights.length, icon: TrendingUp },
          { id: 'actions', label: 'Actions', count: action_items.length, icon: AlertCircle },
          { id: 'quickwins', label: 'Quick Wins', count: quick_wins.length, icon: Zap },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setExpandedSection(tab.id)}
            className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              expandedSection === tab.id
                ? 'bg-white text-[#A57865] border-b-2 border-[#A57865]'
                : 'text-neutral-600 hover:bg-white/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              expandedSection === tab.id ? 'bg-[#A57865]/10' : 'bg-neutral-200'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 max-h-[500px] overflow-y-auto">
        {/* Campaign Suggestions */}
        {expandedSection === 'campaigns' && (
          <div className="space-y-3">
            {campaign_suggestions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No campaign suggestions at this time</p>
                <p className="text-sm text-neutral-400 mt-1">AI will suggest campaigns based on your guest data</p>
              </div>
            ) : (
              campaign_suggestions.map((suggestion) => {
                const IconComponent = ICON_MAP[suggestion.icon] || Target;
                const isApplied = appliedSuggestions.has(suggestion.id);
                return (
                  <div
                    key={suggestion.id}
                    className={`bg-white rounded-xl p-4 border transition-all ${
                      isApplied
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-neutral-200 hover:border-[#A57865]/30 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isApplied ? 'bg-emerald-100' : 'bg-[#A57865]/10'
                      }`}>
                        {isApplied ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <IconComponent className="w-5 h-5 text-[#A57865]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-neutral-900">{suggestion.title}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                            {suggestion.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 mb-3">{suggestion.description}</p>
                        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-neutral-600">{suggestion.target_count} guests</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-neutral-600">{suggestion.estimated_impact}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gift className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-neutral-600">{suggestion.recommended_offer}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="text-neutral-600 capitalize">{suggestion.best_channel}</span>
                          </div>
                        </div>
                        {!isApplied && (
                          <button
                            onClick={() => handleApplySuggestion(suggestion)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#A57865] text-white rounded-lg text-xs font-medium hover:bg-[#8E6554] transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" />
                            Create Campaign
                          </button>
                        )}
                        {isApplied && (
                          <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Campaign created
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Segment Insights */}
        {expandedSection === 'insights' && (
          <div className="space-y-3">
            {segment_insights.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No segment insights available</p>
              </div>
            ) : (
              segment_insights.map((insight, index) => {
                const IconComponent = ICON_MAP[insight.icon] || TrendingUp;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-[#5C9BA4]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-900 mb-1">{insight.title}</h4>
                        <p className="text-sm text-neutral-700 mb-2">{insight.insight}</p>
                        <div className="flex items-start gap-1 bg-[#5C9BA4]/5 rounded-lg p-2">
                          <Sparkles className="w-3.5 h-3.5 text-[#5C9BA4] flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-[#5C9BA4]">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Action Items */}
        {expandedSection === 'actions' && (
          <div className="space-y-3">
            {action_items.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-10 h-10 text-emerald-300 mx-auto mb-3" />
                <p className="text-neutral-500">No action items at this time</p>
                <p className="text-sm text-neutral-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              action_items.map((item, index) => {
                const IconComponent = ICON_MAP[item.icon] || AlertCircle;
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl p-4 border border-neutral-200 border-l-4 hover:shadow-sm transition-shadow ${getUrgencyColor(item.urgency)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-[#4E5840]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900">{item.title}</h4>
                        <p className="text-sm text-neutral-600">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.urgency)}`}>
                          {item.urgency.toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleActionClick(item)}
                          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4 text-neutral-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Quick Wins */}
        {expandedSection === 'quickwins' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quick_wins.length === 0 ? (
              <div className="text-center py-8 col-span-2">
                <Zap className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500">No quick wins available</p>
              </div>
            ) : (
              quick_wins.map((win, index) => {
                const IconComponent = ICON_MAP[win.icon] || Zap;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-4 border border-neutral-200 hover:border-[#CDB261]/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#CDB261]/10 flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-[#CDB261]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-900 mb-1">{win.title}</h4>
                        <p className="text-sm text-neutral-600 mb-3">{win.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500">Effort:</span>
                            <span className={`w-2 h-2 rounded-full ${
                              win.effort === 'low' ? 'bg-emerald-500' : win.effort === 'medium' ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            <span className="text-neutral-700 capitalize">{win.effort}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-neutral-500">Impact:</span>
                            <span className={`w-2 h-2 rounded-full ${getImpactColor(win.impact)}`} />
                            <span className="text-neutral-700 capitalize">{win.impact}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
