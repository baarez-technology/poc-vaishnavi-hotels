/**
 * CRM AI Dashboard - ReConnect AI Integration
 * Comprehensive dashboard for guest intelligence, churn prediction, LTV, sentiment, and campaigns
 */
import React, { useState, useEffect } from 'react';
import {
  Brain,
  Users,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Heart,
  DollarSign,
  Target,
  RefreshCw,
  ChevronRight,
  Activity,
  Zap,
  Mail,
  MessageSquare,
  Award,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import crmAIService, {
  DashboardStats,
  AtRiskGuest,
  RecoveryOpportunity,
  CampaignRecommendations,
  AIAlert,
  SegmentAnalysis
} from '../../../api/services/crm-ai.service';

// Helper components
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'blue'
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
}) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/10 text-blue-600',
    green: 'from-emerald-500/10 to-emerald-600/10 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-600/10 text-amber-600',
    red: 'from-red-500/10 to-red-600/10 text-red-600',
    purple: 'from-purple-500/10 to-purple-600/10 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{title}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-3">
          {trend === 'up' ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          ) : trend === 'down' ? (
            <ArrowDownRight className="w-4 h-4 text-red-500" />
          ) : null}
          <span className={`text-xs font-medium ${
            trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-neutral-500'
          }`}>
            {trendValue}
          </span>
        </div>
      )}
    </div>
  );
};

const HealthDistributionChart = ({ distribution }: { distribution: Record<string, number> }) => {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0) || 1;
  const segments = [
    { key: 'excellent', label: 'Excellent', color: 'bg-emerald-500' },
    { key: 'good', label: 'Good', color: 'bg-blue-500' },
    { key: 'fair', label: 'Fair', color: 'bg-amber-500' },
    { key: 'at_risk', label: 'At Risk', color: 'bg-orange-500' },
    { key: 'critical', label: 'Critical', color: 'bg-red-500' }
  ];

  return (
    <div className="space-y-3">
      <div className="flex h-3 rounded-full overflow-hidden bg-neutral-100">
        {segments.map((segment) => {
          const value = distribution[segment.key] || 0;
          const percentage = (value / total) * 100;
          if (percentage === 0) return null;
          return (
            <div
              key={segment.key}
              className={`${segment.color} transition-all`}
              style={{ width: `${percentage}%` }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-3">
        {segments.map((segment) => {
          const value = distribution[segment.key] || 0;
          return (
            <div key={segment.key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${segment.color}`} />
              <span className="text-xs text-neutral-600">{segment.label}: {value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AtRiskGuestCard = ({ guest }: { guest: AtRiskGuest }) => (
  <div className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-red-200 hover:shadow-sm transition-all">
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
          <User className="w-5 h-5 text-neutral-600" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-neutral-900">{guest.guest_name}</p>
            {guest.vip_status && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">VIP</span>
            )}
          </div>
          <p className="text-xs text-neutral-500">{guest.email}</p>
        </div>
      </div>
      <div className="text-right">
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
          guest.priority === 'critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
        }`}>
          {guest.churn_probability.toFixed(0)}% risk
        </span>
      </div>
    </div>
    <p className="text-xs text-neutral-600 mt-3 line-clamp-2">{guest.alert_message}</p>
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
      <span className="text-xs text-neutral-400">Alert {guest.days_since_alert}d ago</span>
      <Link
        to={`/admin/guests/${guest.guest_id}`}
        className="text-xs font-medium text-[#A57865] hover:text-[#8E6554] flex items-center gap-1"
      >
        View Profile <ChevronRight className="w-3 h-3" />
      </Link>
    </div>
  </div>
);

const RecoveryCard = ({ opportunity }: { opportunity: RecoveryOpportunity }) => (
  <div className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-amber-200 hover:shadow-sm transition-all">
    <div className="flex items-start justify-between mb-3">
      <div>
        <p className="font-medium text-neutral-900">{opportunity.guest_name}</p>
        <p className="text-xs text-neutral-500 capitalize">{opportunity.issue_type.replace('_', ' ')}</p>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-4 rounded-full ${
              i < Math.round(opportunity.severity * 5) ? 'bg-amber-500' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>
    </div>
    <p className="text-xs text-neutral-600 line-clamp-2">{opportunity.issue_description}</p>
    {opportunity.recommended_actions.length > 0 && (
      <div className="mt-3">
        <p className="text-[10px] font-bold text-neutral-500 uppercase mb-1">Recommended</p>
        <p className="text-xs text-[#4E5840]">{opportunity.recommended_actions[0]}</p>
      </div>
    )}
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
      <span className="text-xs text-neutral-400">
        <Clock className="w-3 h-3 inline mr-1" />
        {new Date(opportunity.detected_at).toLocaleDateString()}
      </span>
      <button className="text-xs font-medium text-[#A57865] hover:text-[#8E6554]">
        Take Action
      </button>
    </div>
  </div>
);

const CampaignSection = ({
  title,
  guests,
  icon: Icon,
  color
}: {
  title: string;
  guests: Array<{ guest_id: number; guest_name: string; priority: string; channel: string; predicted_conversion: number; ltv: number }>;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="bg-white rounded-xl border border-neutral-200 p-4">
    <div className="flex items-center gap-2 mb-4">
      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-neutral-900">{title}</h3>
        <p className="text-xs text-neutral-500">{guests.length} guests targeted</p>
      </div>
    </div>
    <div className="space-y-2 max-h-48 overflow-y-auto">
      {guests.slice(0, 5).map((guest) => (
        <div key={guest.guest_id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-neutral-800">{guest.guest_name}</p>
            <p className="text-xs text-neutral-500">{guest.channel} | {guest.predicted_conversion.toFixed(1)}% conv.</p>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
            guest.priority === 'critical' ? 'bg-red-100 text-red-700' :
            guest.priority === 'high' ? 'bg-orange-100 text-orange-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {guest.priority}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const AlertItem = ({ alert, onAcknowledge }: { alert: AIAlert; onAcknowledge: (id: number) => void }) => (
  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-200">
    <div className={`w-2 h-2 rounded-full mt-2 ${
      alert.priority === 'critical' ? 'bg-red-500' :
      alert.priority === 'high' ? 'bg-orange-500' :
      'bg-amber-500'
    }`} />
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-neutral-900">{alert.title}</p>
          <p className="text-xs text-neutral-500">{alert.guest_name}</p>
        </div>
        <button
          onClick={() => onAcknowledge(alert.id)}
          className="p-1 hover:bg-neutral-100 rounded transition-colors"
        >
          <CheckCircle2 className="w-4 h-4 text-neutral-400 hover:text-emerald-500" />
        </button>
      </div>
      <p className="text-xs text-neutral-600 mt-1 line-clamp-2">{alert.message}</p>
      <p className="text-[10px] text-neutral-400 mt-1">
        {new Date(alert.created_at).toLocaleString()}
      </p>
    </div>
  </div>
);

export default function CRMAIDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [atRiskGuests, setAtRiskGuests] = useState<AtRiskGuest[]>([]);
  const [recoveryOpportunities, setRecoveryOpportunities] = useState<RecoveryOpportunity[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecommendations | null>(null);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [segments, setSegments] = useState<SegmentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsData, atRiskData, recoveryData, campaignData, alertData, segmentData] = await Promise.all([
        crmAIService.getDashboardStats(),
        crmAIService.getAtRiskGuests(10, 60),
        crmAIService.getRecoveryOpportunities('detected', 10),
        crmAIService.getCampaignRecommendations(),
        crmAIService.getAIAlerts('open', undefined, 10),
        crmAIService.getSegmentAnalysis()
      ]);

      setStats(statsData);
      setAtRiskGuests(atRiskData.guests);
      setRecoveryOpportunities(recoveryData.opportunities);
      setCampaigns(campaignData);
      setAlerts(alertData.alerts);
      setSegments(segmentData);
    } catch (error) {
      console.error('Failed to fetch CRM AI data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await crmAIService.updateAlert(alertId, 'acknowledged');
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#A57865] animate-spin mx-auto mb-3" />
          <p className="text-neutral-500">Loading CRM AI Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-neutral-50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5C9BA4] via-[#4E5840] to-[#A57865] flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">ReConnect AI Dashboard</h1>
            <p className="text-sm text-neutral-500">
              Guest intelligence, churn prediction, and campaign optimization
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/ai/crm"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#A57865] to-[#8E6554] text-white rounded-xl text-sm font-medium hover:from-[#8E6554] hover:to-[#7D5443] transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            AI Chat
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Guests Analyzed"
          value={stats?.guests_analyzed || 0}
          subtitle={`of ${stats?.total_guests || 0} total`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Avg Health Score"
          value={`${stats?.average_health_score?.toFixed(0) || 0}/100`}
          subtitle="Guest satisfaction"
          icon={Heart}
          color="green"
          trend={stats?.average_health_score && stats.average_health_score >= 70 ? 'up' : 'down'}
          trendValue={stats?.average_health_score && stats.average_health_score >= 70 ? 'Healthy' : 'Needs attention'}
        />
        <StatCard
          title="Avg Churn Risk"
          value={`${stats?.average_churn_risk?.toFixed(0) || 0}%`}
          subtitle="Guest retention risk"
          icon={AlertTriangle}
          color={stats?.average_churn_risk && stats.average_churn_risk > 40 ? 'red' : 'amber'}
        />
        <StatCard
          title="Open Alerts"
          value={stats?.open_alerts || 0}
          subtitle={`${stats?.recovery_pending || 0} recoveries pending`}
          icon={Zap}
          color="purple"
        />
      </div>

      {/* Health Distribution */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Guest Health Distribution</h2>
            <p className="text-sm text-neutral-500">Score breakdown across all analyzed guests</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Clock className="w-4 h-4" />
            Last updated: {stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
        {stats?.health_distribution && (
          <HealthDistributionChart distribution={stats.health_distribution} />
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* At-Risk Guests */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-neutral-900">At-Risk Guests</h2>
              <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                {atRiskGuests.length}
              </span>
            </div>
            <Link
              to="/admin/guests?filter=at-risk"
              className="text-sm font-medium text-[#A57865] hover:text-[#8E6554] flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {atRiskGuests.slice(0, 4).map((guest) => (
              <AtRiskGuestCard key={guest.guest_id} guest={guest} />
            ))}
          </div>
        </div>

        {/* AI Alerts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-neutral-900">AI Alerts</h2>
            </div>
          </div>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {alerts.length > 0 ? alerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} onAcknowledge={handleAcknowledgeAlert} />
            )) : (
              <div className="text-center py-8 text-neutral-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No open alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recovery Opportunities */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-neutral-900">Recovery Opportunities</h2>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">
              {recoveryOpportunities.length}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {recoveryOpportunities.slice(0, 4).map((opp) => (
            <RecoveryCard key={opp.recovery_id} opportunity={opp} />
          ))}
        </div>
      </div>

      {/* Campaign Recommendations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#4E5840]" />
            <h2 className="text-lg font-semibold text-neutral-900">Campaign Recommendations</h2>
          </div>
          <Link
            to="/admin/campaigns"
            className="text-sm font-medium text-[#A57865] hover:text-[#8E6554] flex items-center gap-1"
          >
            Manage Campaigns <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {campaigns && (
            <>
              <CampaignSection
                title="Win-Back"
                guests={campaigns.win_back || []}
                icon={RefreshCw}
                color="bg-red-500"
              />
              <CampaignSection
                title="Loyalty"
                guests={campaigns.loyalty || []}
                icon={Award}
                color="bg-amber-500"
              />
              <CampaignSection
                title="Upsell"
                guests={campaigns.upsell || []}
                icon={TrendingUp}
                color="bg-emerald-500"
              />
              <CampaignSection
                title="Direct Booking"
                guests={campaigns.direct_booking || []}
                icon={Mail}
                color="bg-blue-500"
              />
            </>
          )}
        </div>
      </div>

      {/* Segment Analysis */}
      {segments && (
        <div className="mt-6 bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-[#5C9BA4]" />
            <h2 className="text-lg font-semibold text-neutral-900">Segment Analysis</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Churn Segments */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">Churn Risk Distribution</h3>
              <div className="space-y-2">
                {Object.entries(segments.churn_segments).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 capitalize">{key}</span>
                    <span className="text-sm font-medium text-neutral-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* LTV Segments */}
            <div>
              <h3 className="text-sm font-medium text-neutral-700 mb-3">LTV Segments</h3>
              <div className="space-y-2">
                {Object.entries(segments.ltv_segments).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-sm font-medium text-neutral-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Summary */}
            <div className="flex flex-col justify-center items-center bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4">
              <Sparkles className="w-8 h-8 text-[#A57865] mb-2" />
              <p className="text-2xl font-bold text-neutral-900">{segments.total_analyzed}</p>
              <p className="text-sm text-neutral-500">Guests Analyzed</p>
              <p className="text-xs text-neutral-400 mt-1">
                Last: {new Date(segments.analyzed_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
