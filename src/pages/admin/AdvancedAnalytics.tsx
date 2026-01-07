import { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Send,
  RefreshCw,
  Download,
  FileText,
  AlertTriangle,
  BarChart3,
  Activity,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface KPI {
  value: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface DashboardData {
  period: { start: string; end: string };
  kpis: {
    revenue: KPI;
    occupancy: KPI;
    bookings: KPI;
    guests: KPI;
    adr: KPI;
    revpar: KPI;
  };
  insights: Insight[];
  anomalies: Anomaly[];
  generated_at: string;
}

interface Insight {
  title: string;
  description: string;
  metric: string;
  value: number;
  trend: string;
  change_percent: number;
  severity: string;
  recommendations: string[];
}

interface Anomaly {
  metric: string;
  date: string;
  expected_value: number;
  actual_value: number;
  deviation_percent: number;
  severity: string;
  description: string;
}

interface Prediction {
  date: string;
  predicted_value: number;
  confidence_low: number;
  confidence_high: number;
  confidence_level: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  visualization?: any;
}

const DATE_RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'ytd', label: 'Year to Date' }
];

const REPORT_TYPES = [
  { id: 'daily_operations', name: 'Daily Operations', icon: Activity },
  { id: 'revenue_analysis', name: 'Revenue Analysis', icon: TrendingUp },
  { id: 'guest_analytics', name: 'Guest Analytics', icon: BarChart3 },
  { id: 'executive_summary', name: 'Executive Summary', icon: FileText }
];

export default function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState('this_week');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat' | 'reports' | 'predictions'>('dashboard');

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/analytics/dashboard?date_range=${dateRange}`);
      const data = response.data?.data || response.data;
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const fetchPredictions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/analytics/predictions/revenue?days_ahead=30');
      const data = response.data?.data || response.data;
      setPredictions(data.predictions || []);
    } catch (error) {
      console.error('Failed to fetch predictions:', error);
    }
  }, []);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await api.get('/api/v1/analytics/query/suggestions');
      const data = response.data?.data || response.data;
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    fetchPredictions();
    fetchSuggestions();
  }, [fetchDashboard, fetchPredictions, fetchSuggestions]);

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await api.post('/api/v1/analytics/query', {
        query: chatInput,
        session_id: sessionId
      });
      const resData = response.data?.data || response.data;

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: resData.response,
        data: resData.data,
        visualization: resData.visualization
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      setSessionId(resData.session_id);

      if (resData.follow_up_suggestions) {
        setSuggestions(resData.follow_up_suggestions);
      }
    } catch (error) {
      console.error('Chat query failed:', error);
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerateReport = async (reportType: string) => {
    setSelectedReport(reportType);
    setReportLoading(true);

    try {
      const response = await api.post('/api/v1/analytics/reports/generate', {
        report_type: reportType,
        date_range: dateRange
      });
      const data = response.data?.data || response.data;
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReport = async (format: string) => {
    if (!selectedReport) return;

    try {
      const response = await api.get(
        `/api/v1/analytics/reports/${selectedReport}/export?format=${format}&date_range=${dateRange}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedReport}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const TrendIcon = ({ trend, change }: { trend: string; change: number }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-sage-600" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-gold-600" />;
    return <Minus className="w-3.5 h-3.5 text-neutral-400" />;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/admin/reports"
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Advanced Analytics</h1>
              <p className="text-[13px] text-neutral-500">AI-powered insights and natural language BI</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
                className="h-9 px-4 pr-9 rounded-lg bg-white border border-neutral-200 text-[13px] font-medium text-neutral-700 cursor-pointer flex items-center gap-2 hover:border-neutral-300 transition-colors"
              >
                {DATE_RANGES.find(r => r.value === dateRange)?.label}
                <ChevronDown className={`w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 transition-transform ${dateDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {dateDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setDateDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 z-50">
                    {DATE_RANGES.map(range => (
                      <button
                        key={range.value}
                        onClick={() => {
                          setDateRange(range.value);
                          setDateDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                          dateRange === range.value
                            ? 'bg-terra-50 text-terra-600'
                            : 'text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={fetchDashboard}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-200">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'chat', label: 'Ask Analytics', icon: Brain },
            { id: 'reports', label: 'AI Reports', icon: FileText },
            { id: 'predictions', label: 'Predictions', icon: Zap }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 -mb-[2px] transition-colors ${
                activeTab === tab.id
                  ? 'border-terra-500 text-terra-600'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPI Grid */}
            {dashboard && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { title: 'Revenue', kpi: dashboard.kpis.revenue, format: 'currency' },
                  { title: 'Occupancy', kpi: dashboard.kpis.occupancy, format: 'percent' },
                  { title: 'Bookings', kpi: dashboard.kpis.bookings, format: 'number' },
                  { title: 'Guests', kpi: dashboard.kpis.guests, format: 'number' },
                  { title: 'ADR', kpi: dashboard.kpis.adr, format: 'currency' },
                  { title: 'RevPAR', kpi: dashboard.kpis.revpar, format: 'currency' }
                ].map((item, i) => {
                  const formatValue = (v: number) => {
                    if (item.format === 'currency') return formatCurrency(v);
                    if (item.format === 'percent') return formatPercent(v);
                    return v.toLocaleString();
                  };

                  return (
                    <div key={i} className="bg-white rounded-xl p-5">
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">{item.title}</p>
                      <p className="text-2xl font-semibold text-neutral-900">{formatValue(item.kpi.value)}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <TrendIcon trend={item.kpi.trend} change={item.kpi.change} />
                        <span className={`text-[11px] font-medium ${item.kpi.change >= 0 ? 'text-sage-600' : 'text-gold-600'}`}>
                          {item.kpi.change >= 0 ? '+' : ''}{item.kpi.change.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-neutral-400">vs last period</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Insights */}
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-sm font-semibold text-neutral-900 mb-1">AI Insights</h2>
                <p className="text-[12px] text-neutral-500 mb-4">Key findings and recommendations</p>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {dashboard?.insights.slice(0, 5).map((insight, i) => (
                    <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-100">
                      <h4 className="text-[13px] font-semibold text-neutral-800">{insight.title}</h4>
                      <p className="text-[12px] text-neutral-600 mt-1">{insight.description}</p>
                      {insight.recommendations.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {insight.recommendations.slice(0, 2).map((rec, j) => (
                            <li key={j} className="flex items-start gap-1.5 text-[11px] text-neutral-500">
                              <ChevronRight className="w-3 h-3 mt-0.5 text-neutral-400" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                  {(!dashboard?.insights || dashboard.insights.length === 0) && (
                    <p className="text-[13px] text-neutral-500 text-center py-8">No insights available</p>
                  )}
                </div>
              </div>

              {/* Anomalies */}
              <div className="bg-white rounded-xl p-6">
                <h2 className="text-sm font-semibold text-neutral-900 mb-1">Detected Anomalies</h2>
                <p className="text-[12px] text-neutral-500 mb-4">Unusual patterns in your data</p>

                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {dashboard?.anomalies.map((anomaly, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-terra-50 border border-terra-100 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-terra-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-neutral-800 truncate">{anomaly.description}</p>
                        <p className="text-[11px] text-neutral-500">
                          Expected: {anomaly.expected_value.toLocaleString()} · Actual: {anomaly.actual_value.toLocaleString()}
                        </p>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 bg-terra-100 text-terra-700 rounded font-medium">
                        {anomaly.deviation_percent.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                  {(!dashboard?.anomalies || dashboard.anomalies.length === 0) && (
                    <div className="flex items-center gap-3 p-4 bg-sage-50 border border-sage-100 rounded-lg">
                      <Activity className="w-4 h-4 text-sage-600" />
                      <p className="text-[13px] text-sage-700 font-medium">All metrics are within normal ranges</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-terra-500 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Analytics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Revenue Trend', query: 'Show revenue trend for this month' },
                  { label: 'Occupancy Forecast', query: 'Forecast occupancy for next week' },
                  { label: 'Booking Comparison', query: 'Compare bookings this week vs last week' },
                  { label: 'Guest Insights', query: 'How many returning guests this month?' }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveTab('chat');
                      setChatInput(action.query);
                    }}
                    className="text-left p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <span className="text-[13px] font-medium text-white">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="p-4 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-900">Natural Language Analytics</h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">Ask questions about your hotel's performance</p>
            </div>

            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-[13px] text-neutral-500 mb-4">Ask a question to get started</p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setChatInput(suggestion)}
                        className="px-3 py-1.5 text-[12px] bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors font-medium"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl p-4 ${
                    msg.role === 'user' ? 'bg-terra-500 text-white' : 'bg-neutral-100 text-neutral-900'
                  }`}>
                    <p className="text-[13px] whitespace-pre-wrap">{msg.content}</p>
                    {msg.data && (
                      <div className="mt-3 p-3 bg-white/10 rounded-lg">
                        <pre className="text-[11px] overflow-x-auto">{JSON.stringify(msg.data, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-100 rounded-xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {chatMessages.length > 0 && suggestions.length > 0 && (
              <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-neutral-400 font-medium">Suggestions:</span>
                  {suggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(s)}
                      className="text-[11px] px-2 py-1 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-100 font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border-t border-neutral-100">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask about revenue, occupancy, bookings..."
                  className="flex-1 h-10 px-4 border border-neutral-200 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={!chatInput.trim() || chatLoading}
                  className="px-4 h-10 bg-terra-500 text-white rounded-lg hover:bg-terra-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6">
              <h2 className="text-sm font-semibold text-neutral-900 mb-1">AI Report Builder</h2>
              <p className="text-[12px] text-neutral-500 mb-4">Generate detailed reports</p>

              <div className="space-y-2">
                {REPORT_TYPES.map(report => (
                  <button
                    key={report.id}
                    onClick={() => handleGenerateReport(report.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      selectedReport === report.id
                        ? 'bg-terra-50 text-terra-900 border border-terra-200'
                        : 'hover:bg-neutral-50 border border-transparent'
                    }`}
                  >
                    <report.icon className="w-4 h-4" />
                    <span className="text-[13px] font-medium">{report.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl p-6">
              {!selectedReport && (
                <div className="text-center py-16">
                  <FileText className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-[13px] text-neutral-500">Select a report type to generate</p>
                </div>
              )}

              {reportLoading && (
                <div className="text-center py-16">
                  <RefreshCw className="w-8 h-8 text-terra-500 animate-spin mx-auto mb-3" />
                  <p className="text-[13px] text-neutral-500">Generating report...</p>
                </div>
              )}

              {reportData && !reportLoading && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {reportData.report_type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                      </h3>
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        {reportData.period?.start} to {reportData.period?.end}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleExportReport('pdf')}
                        className="h-8 px-3 rounded-lg bg-terra-500 text-white text-[12px] font-medium flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                      <button
                        onClick={() => handleExportReport('csv')}
                        className="h-8 px-3 rounded-lg bg-white border border-neutral-200 text-neutral-700 text-[12px] font-medium flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        CSV
                      </button>
                    </div>
                  </div>

                  {reportData.kpis && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {Object.entries(reportData.kpis).slice(0, 6).map(([key, data]: [string, any]) => (
                        <div key={key} className="p-3 bg-neutral-50 rounded-lg">
                          <p className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{key}</p>
                          <p className="text-lg font-semibold text-neutral-900">{data.value?.toLocaleString()}</p>
                          {data.change !== undefined && (
                            <span className={`text-[11px] font-medium ${data.change >= 0 ? 'text-sage-600' : 'text-gold-600'}`}>
                              {data.change >= 0 ? '+' : ''}{data.change.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {reportData.recommendations && reportData.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-3">Recommendations</h4>
                      <ul className="space-y-2">
                        {reportData.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-600">
                            <ChevronRight className="w-4 h-4 mt-0.5 text-terra-500" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">Revenue Forecast</h2>
                  <p className="text-[12px] text-neutral-500">Predicted revenue for the next 30 days</p>
                </div>
              </div>

              <div className="h-64 flex items-end gap-1">
                {predictions.slice(0, 30).map((pred, i) => {
                  const maxValue = Math.max(...predictions.map(p => p.predicted_value));
                  const height = (pred.predicted_value / maxValue) * 100;

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative">
                      <div
                        className="w-full bg-terra-400 hover:bg-terra-500 rounded-t transition-colors"
                        style={{ height: `${height}%` }}
                      />
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-neutral-900 text-white text-[11px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
                        {new Date(pred.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        <br />
                        {formatCurrency(pred.predicted_value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">7-Day Outlook</h3>
                <p className="text-[12px] text-neutral-500 mb-4">Daily predictions</p>

                <div className="space-y-1">
                  {predictions.slice(0, 7).map((pred, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                      <span className="text-[12px] text-neutral-600">
                        {new Date(pred.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[13px] font-semibold text-neutral-900">{formatCurrency(pred.predicted_value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl p-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">Confidence Levels</h3>
                <p className="text-[12px] text-neutral-500 mb-4">Prediction accuracy</p>

                <div className="space-y-4">
                  {[
                    { label: '1-7 Days', confidence: 85 },
                    { label: '8-14 Days', confidence: 70 },
                    { label: '15-30 Days', confidence: 55 }
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="text-neutral-600">{item.label}</span>
                        <span className="font-semibold text-neutral-900">{item.confidence}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-terra-500 rounded-full" style={{ width: `${item.confidence}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-terra-500 rounded-xl p-6 text-white">
                <h3 className="text-sm font-semibold mb-1">What-If Scenario</h3>
                <p className="text-[12px] opacity-80 mb-4">Model the impact of changes</p>
                <button
                  onClick={() => {
                    setActiveTab('chat');
                    setChatInput('Run a scenario analysis for a 10% rate increase');
                  }}
                  className="w-full py-2.5 bg-white/20 hover:bg-white/30 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Try Scenario Analysis
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
