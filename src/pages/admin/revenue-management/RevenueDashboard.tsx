import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Sparkles,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { revenueIntelligenceService, DashboardResponse, PricingRecommendation, PricingRule, SegmentPerformance } from '../../../api/services/revenue-intelligence.service';
import { useToast } from '../../../contexts/ToastContext';
import { DemandLevelBadge } from '../../../components/revenue-management/DemandChart';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter, ConfirmModal } from '../../../components/ui2/Modal';
import { Button } from '../../../components/ui2/Button';

// Skeleton Loader Component
function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-100 ${className}`} />
  );
}

// KPI Card Component - Consistent with Design System
interface KPICardProps {
  title: string;
  value: string | number;
  trendValue?: number | null;
  icon: React.ElementType;
  accentColor?: 'terra' | 'sage' | 'gold' | 'ocean';
  index?: number;
  children?: React.ReactNode;
  isLoading?: boolean;
  subtitle?: string;
}

function KPICard({ title, value, trendValue, icon: Icon, accentColor = 'terra', index = 0, children, isLoading, subtitle }: KPICardProps) {
  const isPositive = trendValue !== null && trendValue !== undefined && trendValue >= 0;

  const accentStyles = {
    terra: { bg: 'bg-terra-50', icon: 'text-terra-600' },
    sage: { bg: 'bg-sage-50', icon: 'text-sage-600' },
    gold: { bg: 'bg-gold-50', icon: 'text-gold-600' },
    ocean: { bg: 'bg-ocean-50', icon: 'text-ocean-600' },
  };

  const style = accentStyles[accentColor] || accentStyles.terra;

  if (isLoading) {
    return (
      <div className="rounded-[10px] bg-white p-4 sm:p-6" style={{ animationDelay: `${index * 100}ms` }}>
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <SkeletonLoader className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg" />
          <SkeletonLoader className="h-4 w-20 sm:w-24" />
        </div>
        <SkeletonLoader className="h-7 sm:h-9 w-24 sm:w-32 mb-2" />
        <SkeletonLoader className="h-5 w-24 sm:w-28" />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[10px] bg-white p-4 sm:p-6"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${style.icon}`} />
        </div>
        <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-neutral-400 truncate">
          {title}
        </p>
      </div>

      {/* Value */}
      <p className="text-xl sm:text-[28px] font-semibold tracking-tight text-neutral-900 mb-2">
        {value}
      </p>

      {/* Comparison */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">{subtitle || 'vs Last Week'}</p>
        {trendValue !== null && trendValue !== undefined ? (
          <div className={`flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold ${
            isPositive ? 'text-sage-600' : 'text-rose-600'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
            {isPositive ? '+' : ''}{trendValue}%
          </div>
        ) : children}
      </div>
    </div>
  );
}

const RevenueDashboard = () => {
  const { showToast } = useToast();

  // State for API data
  const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
  const [recommendations, setRecommendations] = useState<PricingRecommendation[]>([]);
  const [totalOpportunity, setTotalOpportunity] = useState<number>(0);
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [segments, setSegments] = useState<SegmentPerformance[]>([]);
  const [pickupMetrics, setPickupMetrics] = useState<{
    strong_days: number;
    critical_days: number;
    total_remaining: number;
  } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState('7d');
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Fetch dashboard data from API
  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      const [dashboard, recsResponse, pricingRules, pickupData, segmentsData] = await Promise.all([
        revenueIntelligenceService.getDashboard(),
        revenueIntelligenceService.getPricingRecommendations(),
        revenueIntelligenceService.getPricingRules(),
        revenueIntelligenceService.getPickupMetrics(7).catch(() => null),
        revenueIntelligenceService.getSegmentPerformance().catch(() => []),
      ]);

      setDashboardData(dashboard);
      setRecommendations(recsResponse?.recommendations || []);
      setTotalOpportunity(recsResponse?.total_opportunity || 0);
      setRules(Array.isArray(pricingRules) ? pricingRules : []);
      setSegments(Array.isArray(segmentsData) ? segmentsData : []);
      if (pickupData?.summary) {
        setPickupMetrics({
          strong_days: pickupData.summary.strong_pace_days || 0,
          critical_days: pickupData.summary.critical_pace_days || 0,
          total_remaining: pickupData.summary.total_remaining_rooms || 0,
        });
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
      showToast('Failed to load dashboard', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Cmd/Ctrl + R - Refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
        e.preventDefault();
        setShowRefreshConfirm(true);
      }
      // Cmd/Ctrl + E - Export
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    setShowRefreshConfirm(false);
    try {
      // Run all pricing rules via API
      await revenueIntelligenceService.executePricingRules();
      // Refetch dashboard data
      await fetchDashboardData();
      showToast('Dashboard data refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh dashboard data', 'error');
      setIsRefreshing(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      showToast('Generating CSV export...', 'info');

      if (!dashboardData) {
        showToast('No data to export', 'error');
        return;
      }

      // Prepare CSV data
      const csvData: (string | number)[][] = [];

      // Add headers
      csvData.push(['Revenue Management Dashboard Export']);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push(['Period:', `${getPeriodDays()} Days`]);
      csvData.push([]);

      // KPIs Section
      const kpis = dashboardData.kpis?.next_7_days;
      csvData.push(['KEY METRICS']);
      csvData.push(['Metric', 'Value', 'Change']);
      csvData.push([
        `${getPeriodDays()}-Day Revenue`,
        `$${getPeriodRevenue().toLocaleString()}`,
        `${kpis?.revenue_trend || 0}%`
      ]);
      csvData.push([
        'Avg Occupancy',
        `${kpis?.occupancy || 0}%`,
        `${kpis?.occupancy_trend || 0}%`
      ]);
      csvData.push([
        'Avg ADR',
        `$${kpis?.adr || 0}`,
        `${kpis?.adr_trend || 0}%`
      ]);
      csvData.push(['Active Pricing Rules', rules.filter(r => r.isActive).length, '']);
      csvData.push([]);

      // Revenue Forecast
      csvData.push(['REVENUE FORECAST (14 Days)']);
      csvData.push(['Date', 'Revenue', 'Occupancy %']);
      revenueChartData.forEach(day => {
        csvData.push([day.date, `$${day.revenue}`, `${day.occupancy}%`]);
      });
      csvData.push([]);

      // High Impact Days
      if (dashboardData.high_impact_days && dashboardData.high_impact_days.length > 0) {
        csvData.push(['HIGH DEMAND DAYS']);
        csvData.push(['Date', 'Demand Level', 'Occupancy %']);
        dashboardData.high_impact_days.slice(0, 5).forEach(day => {
          const date = new Date(day.date).toLocaleDateString('en-US', {
            weekday: 'short', month: 'short', day: 'numeric'
          });
          csvData.push([date, day.demand_level, `${day.forecasted_occupancy}%`]);
        });
        csvData.push([]);
      }

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rms-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('CSV exported successfully', 'success');
      setShowExportOptions(false);
    } catch (error) {
      showToast('Failed to export CSV', 'error');
    }
  };

  // Export to PDF
  const exportToPDF = () => {
    try {
      showToast('Generating PDF export...', 'info');

      if (!dashboardData) {
        showToast('No data to export', 'error');
        return;
      }

      // Create a simple HTML-based PDF export using print
      const printWindow = window.open('', '', 'width=800,height=600');

      if (!printWindow) {
        showToast('Failed to open print window', 'error');
        return;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>RMS Dashboard Export</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 40px;
              color: #1a1a1a;
            }
            h1 {
              color: #4E5840;
              border-bottom: 3px solid #A57865;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            h2 {
              color: #A57865;
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 18px;
            }
            .meta {
              color: #6A6A6A;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .kpi-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .kpi-card {
              border: 1px solid #E5E4E0;
              border-radius: 8px;
              padding: 20px;
              background: #fafaf9;
            }
            .kpi-label {
              font-size: 12px;
              color: #6A6A6A;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .kpi-value {
              font-size: 28px;
              font-weight: bold;
              color: #1a1a1a;
              margin: 8px 0;
            }
            .kpi-trend {
              font-size: 14px;
              color: #059669;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            th {
              background: #4E5840;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #E5E4E0;
            }
            tr:nth-child(even) {
              background: #fafaf9;
            }
            .positive { color: #059669; }
            .negative { color: #dc2626; }
            @media print {
              body { padding: 20px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Revenue Management System Dashboard</h1>
          <div class="meta">
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Period:</strong> ${getPeriodDays()} Days</p>
            <p><strong>Last Updated:</strong> ${getLastUpdatedText()}</p>
          </div>

          <h2>Key Metrics</h2>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">${getPeriodDays()}-Day Revenue Forecast</div>
              <div class="kpi-value">$${getPeriodRevenue().toLocaleString()}</div>
              <div class="kpi-trend ${(dashboardData.kpis?.next_7_days?.revenue_trend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(dashboardData.kpis?.next_7_days?.revenue_trend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(dashboardData.kpis?.next_7_days?.revenue_trend || 0)}%
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg Occupancy</div>
              <div class="kpi-value">${dashboardData.kpis?.next_7_days?.occupancy || 0}%</div>
              <div class="kpi-trend ${(dashboardData.kpis?.next_7_days?.occupancy_trend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(dashboardData.kpis?.next_7_days?.occupancy_trend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(dashboardData.kpis?.next_7_days?.occupancy_trend || 0)}%
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg ADR</div>
              <div class="kpi-value">$${dashboardData.kpis?.next_7_days?.adr || 0}</div>
              <div class="kpi-trend ${(dashboardData.kpis?.next_7_days?.adr_trend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(dashboardData.kpis?.next_7_days?.adr_trend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(dashboardData.kpis?.next_7_days?.adr_trend || 0)}%
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Active Pricing Rules</div>
              <div class="kpi-value">${rules.filter(r => r.isActive).length}</div>
            </div>
          </div>

          <h2>Revenue Forecast (14 Days)</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              ${revenueChartData.map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>$${day.revenue.toLocaleString()}</td>
                  <td>${day.occupancy}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${dashboardData.high_impact_days && dashboardData.high_impact_days.length > 0 ? `
          <h2>High Demand Days</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Demand Level</th>
                <th>Occupancy</th>
              </tr>
            </thead>
            <tbody>
              ${dashboardData.high_impact_days.slice(0, 5).map(day => {
                const date = new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                });
                return `
                  <tr>
                    <td>${date}</td>
                    <td>${day.demand_level}</td>
                    <td>${day.forecasted_occupancy}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="no-print" style="margin-top: 40px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #4E5840; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Print / Save as PDF
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background: #6A6A6A; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; margin-left: 10px;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      setTimeout(() => {
        showToast('PDF ready - use Print dialog to save', 'success');
        setShowExportOptions(false);
      }, 500);
    } catch (error) {
      showToast('Failed to generate PDF', 'error');
    }
  };

  const handleExport = () => {
    setShowExportOptions(true);
  };

  // Format last updated time
  const getLastUpdatedText = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  // Time period options
  const periodOptions = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
    { label: 'Custom', value: 'custom' },
  ];

  // Calculate revenue based on time period
  const getPeriodRevenue = () => {
    if (!dashboardData?.kpis) return 0;

    switch (timePeriod) {
      case '30d':
        return dashboardData.kpis.next_30_days?.total_revenue || 0;
      case '90d':
        return (dashboardData.kpis.next_30_days?.total_revenue || 0) * 3;
      case 'custom': {
        // Calculate based on custom date range
        const days = Math.ceil((customDateRange.end.getTime() - customDateRange.start.getTime()) / (1000 * 60 * 60 * 24));
        const dailyAvg = (dashboardData.kpis.next_30_days?.total_revenue || 0) / 30;
        return Math.round(dailyAvg * days);
      }
      case '7d':
      default:
        return dashboardData.kpis.next_7_days?.total_revenue || 0;
    }
  };

  const getPeriodDays = () => {
    switch (timePeriod) {
      case '30d': return 30;
      case '90d': return 90;
      case 'custom': {
        const days = Math.ceil((customDateRange.end.getTime() - customDateRange.start.getTime()) / (1000 * 60 * 60 * 24));
        return days;
      }
      case '7d':
      default: return 7;
    }
  };

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setTimePeriod(value);
    }
  };

  const handleCustomDateApply = () => {
    setTimePeriod('custom');
    setShowDatePicker(false);
    showToast(`Custom range applied: ${getPeriodDays()} days`, 'success');
  };

  // Get critical alerts count
  const criticalAlerts = recommendations.filter(r => r.priority === 'critical').length;
  const highAlerts = recommendations.filter(r => r.priority === 'high').length;

  // Chart data for revenue trend (using forecast array from API)
  // Get total rooms from KPI data (occupied_room_nights / days gives average, but we need capacity)
  const totalRooms = 70; // Default room count - should come from API
  const avgAdr = dashboardData?.kpis?.next_7_days?.adr || 200;

  const revenueChartData = dashboardData?.forecast?.slice(0, 14).map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    // Revenue = (occupancy% / 100) * rooms * ADR
    revenue: Math.round((item.forecasted_occupancy / 100) * totalRooms * avgAdr),
    occupancy: item.forecasted_occupancy,
  })) || [];

  // Segment pie data - use API data or fallback to defaults
  const segmentColors: Record<string, string> = {
    'Corporate': '#4E5840',
    'Leisure': '#A57865',
    'OTA': '#5C9BA4',
    'Direct': '#CDB261',
    'Group': '#C8B29D',
    'Business': '#4E5840',
    'default': '#888888'
  };

  const segmentPieData = segments.length > 0
    ? segments.slice(0, 5).map(seg => ({
        name: seg.segmentName,
        value: Math.round(seg.revenueContribution || 0),
        color: segmentColors[seg.segmentName] || segmentColors['default']
      }))
    : [
        { name: 'Corporate', value: 35, color: '#4E5840' },
        { name: 'Leisure', value: 28, color: '#A57865' },
        { name: 'OTA', value: 22, color: '#5C9BA4' },
        { name: 'Direct', value: 10, color: '#CDB261' },
        { name: 'Group', value: 5, color: '#C8B29D' },
      ];

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F9F7F7' }}>
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 mx-auto mb-3 sm:mb-4" />
          <h2 className="text-base sm:text-lg font-semibold text-neutral-800 mb-1.5 sm:mb-2">Failed to Load Dashboard</h2>
          <p className="text-xs sm:text-sm text-neutral-500 mb-3 sm:mb-4">{error}</p>
          <Button onClick={fetchDashboardData} variant="primary" className="text-xs sm:text-sm">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">

        {/* Header */}
        <header className="flex flex-col gap-3 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
                Revenue Management
              </h1>
              <p className="text-xs sm:text-[13px] text-neutral-500 mt-0.5 sm:mt-1">
                <span className="hidden sm:inline">AI-powered pricing optimization - Updated {getLastUpdatedText()}</span>
                <span className="sm:hidden">Updated {getLastUpdatedText()}</span>
              </p>
            </div>

            {/* Action Buttons - Always visible */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Export Button */}
              <Button
                variant="outline"
                icon={Download}
                onClick={handleExport}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Export</span>
              </Button>

              {/* Refresh Button */}
              <Button
                variant="primary"
                icon={RefreshCw}
                onClick={() => setShowRefreshConfirm(true)}
                disabled={isRefreshing}
                loading={isRefreshing}
                className="text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </Button>
            </div>
          </div>

          {/* Time Period Selector - Full width on mobile */}
          <div className="flex items-center gap-1 p-1 sm:p-1.5 rounded-lg bg-neutral-100 w-full sm:w-fit overflow-x-auto">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handlePeriodChange(option.value)}
                className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-[13px] font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  timePeriod === option.value
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {/* Alerts Banner */}
        {(criticalAlerts > 0 || highAlerts > 0) && !isLoading && (
          <div className={`rounded-[10px] p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
            criticalAlerts > 0 ? 'bg-rose-50' : 'bg-gold-50'
          }`}>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                criticalAlerts > 0 ? 'bg-rose-100' : 'bg-gold-100'
              }`}>
                <AlertTriangle className={`w-4 h-4 sm:w-5 sm:h-5 ${criticalAlerts > 0 ? 'text-rose-600' : 'text-gold-600'}`} />
              </div>
              <div>
                <p className={`text-xs sm:text-[13px] font-semibold ${
                  criticalAlerts > 0 ? 'text-rose-800' : 'text-gold-800'
                }`}>
                  {criticalAlerts + highAlerts} Pricing Action{criticalAlerts + highAlerts !== 1 ? 's' : ''} Needed
                </p>
                <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                  {criticalAlerts > 0 && `${criticalAlerts} critical`}
                  {criticalAlerts > 0 && highAlerts > 0 && ', '}
                  {highAlerts > 0 && `${highAlerts} high priority`}
                </p>
              </div>
            </div>
            <Link
              to="/admin/revenue/calendar"
              className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-[13px] font-semibold rounded-lg text-white transition-colors text-center ${
                criticalAlerts > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gold-600 hover:bg-gold-700'
              }`}
            >
              Take Action
            </Link>
          </div>
        )}

        {/* Key Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KPICard
            title={`${getPeriodDays()}-Day Revenue`}
            value={`$${(getPeriodRevenue() / 1000).toFixed(0)}K`}
            trendValue={dashboardData?.kpis?.next_7_days?.revenue_trend || null}
            icon={DollarSign}
            accentColor="sage"
            index={0}
            isLoading={isLoading}
            subtitle="Projected revenue"
          />

          <KPICard
            title="Avg Occupancy"
            value={`${dashboardData?.kpis?.next_7_days?.occupancy || 0}%`}
            trendValue={dashboardData?.kpis?.next_7_days?.occupancy_trend || null}
            icon={BarChart3}
            accentColor="terra"
            index={1}
            isLoading={isLoading}
            subtitle="Next 7 days"
          />

          <KPICard
            title="Avg ADR"
            value={`$${dashboardData?.kpis?.next_7_days?.adr || 0}`}
            trendValue={dashboardData?.kpis?.next_7_days?.adr_trend || null}
            icon={TrendingUp}
            accentColor="ocean"
            index={2}
            isLoading={isLoading}
            subtitle="Average daily rate"
          />

          <KPICard
            title="Active Rules"
            value={rules.filter(r => r.isActive).length}
            trendValue={null}
            icon={Sparkles}
            accentColor="gold"
            index={3}
            isLoading={isLoading}
            subtitle="Pricing rules"
          >
            <Link
              to="/admin/revenue/pricing"
              className="text-[10px] sm:text-[11px] font-semibold text-terra-600 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </KPICard>
        </section>

        {/* Revenue Forecast Chart - Full Width */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">Revenue & Occupancy Forecast</h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">14-day outlook</p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Legend - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-sage-500" />
                  <span className="text-[11px] text-neutral-600 font-medium">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-terra-500" style={{ borderStyle: 'dashed', borderWidth: '1.5px', borderColor: '#A57865' }} />
                  <span className="text-[11px] text-neutral-600 font-medium">Occupancy</span>
                </div>
              </div>
              <Link to="/admin/revenue/forecast">
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                  <span className="hidden sm:inline">View All</span>
                  <span className="sm:hidden">View</span>
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Stats */}
          {!isLoading && (
            <div className="px-4 sm:px-6 pb-3 sm:pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-50">
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Total Projected</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-800">
                  ${(revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-50">
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Avg Daily Revenue</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-800">
                  ${(revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / Math.max(revenueChartData.length, 1) / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-50">
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Avg Occupancy</p>
                <p className="text-base sm:text-lg font-semibold text-neutral-800">
                  {(revenueChartData.reduce((sum, d) => sum + d.occupancy, 0) / Math.max(revenueChartData.length, 1)).toFixed(0)}%
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-neutral-50">
                <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">Peak Day</p>
                <p className="text-base sm:text-lg font-semibold text-sage-600">
                  {revenueChartData.length > 0 ? revenueChartData.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueChartData[0]).date : '-'}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <SkeletonLoader className="h-60 sm:h-80 w-full rounded-lg" />
            </div>
          ) : revenueChartData.length === 0 ? (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="h-60 sm:h-80 flex items-center justify-center bg-neutral-50 rounded-lg">
                <p className="text-xs sm:text-[13px] text-neutral-400">No forecast data available</p>
              </div>
            </div>
          ) : (
            <div className="h-60 sm:h-80 px-4 sm:px-6 pb-4 sm:pb-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4E5840" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4E5840" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A57865" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#A57865" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={{ stroke: '#E5E4E0' }}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    dx={-5}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    dx={5}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #E5E4E0',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : `${value}%`,
                      name === 'revenue' ? 'Revenue' : 'Occupancy'
                    ]}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4E5840"
                    strokeWidth={2.5}
                    fill="url(#colorRevenue)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#4E5840', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#A57865"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    fill="url(#colorOccupancy)"
                    dot={false}
                    activeDot={{ r: 5, fill: '#A57865', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* High Demand Days - Full Width */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">High Demand Days</h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">Peak occupancy opportunities</p>
            </div>
            <Link to="/admin/revenue/forecast">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">View All</span>
                <span className="sm:hidden">View</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
              {[...Array(5)].map((_, i) => (
                <SkeletonLoader key={i} className={`h-24 sm:h-28 w-full rounded-lg ${i >= 3 ? 'hidden sm:block' : ''}`} />
              ))}
            </div>
          ) : (dashboardData?.high_impact_days || []).length === 0 ? (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="p-4 sm:p-6 rounded-lg bg-neutral-50 border border-neutral-100 text-center">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-neutral-300 mb-2" />
                <p className="text-xs sm:text-sm font-medium text-neutral-600">No High Demand Days</p>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1">
                  No dates with 80%+ forecasted occupancy in the next 14 days
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
              {(dashboardData?.high_impact_days || []).slice(0, 5).map((day, index) => (
                <div
                  key={day.date}
                  className={`p-2 sm:p-3 rounded-lg bg-rose-50 border border-rose-100 text-center hover:bg-rose-100 transition-colors ${index >= 3 ? 'hidden sm:block' : ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-base sm:text-lg font-bold text-neutral-800">
                    {new Date(day.date).getDate()}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <div className="flex justify-center mt-1">
                    <DemandLevelBadge level={day.demand_level} />
                  </div>
                  <p className="text-xs sm:text-[13px] font-bold text-rose-600 mt-1">
                    {day.forecasted_occupancy}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Three Column Grid: Segment, Market Position, Pickup Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Segment Pie Chart */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">Revenue by Segment</h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">Top 5 segments</p>
            </div>
            {isLoading ? (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <SkeletonLoader className="h-40 sm:h-48 w-full rounded-lg" />
              </div>
            ) : segmentPieData.length === 0 ? (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="h-32 sm:h-36 flex items-center justify-center bg-neutral-50 rounded-lg">
                  <p className="text-[10px] sm:text-[11px] text-neutral-400">No segment data available</p>
                </div>
              </div>
            ) : (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="h-32 sm:h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={50}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {segmentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value: number) => [`${value}%`, 'Share']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E4E0',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Segment Indicators */}
                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                  {segmentPieData.slice(0, 5).map((segment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-[10px] sm:text-[11px] text-neutral-600 truncate max-w-[80px] sm:max-w-[100px]">
                          {segment.name}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-800">
                        {segment.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Market Position */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">Market Position</h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">Competitive analysis</p>
            </div>
            {isLoading ? (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-5 sm:h-6 w-full" />
                ))}
              </div>
            ) : (() => {
              // Calculate market position from recommendations
              const underpricedDays = recommendations.filter(r => r.change_percent > 0).length;
              const overpricedDays = recommendations.filter(r => r.change_percent < 0).length;
              const avgGap = recommendations.length > 0
                ? Math.round(recommendations.reduce((sum, r) => sum + r.change_percent, 0) / recommendations.length)
                : 0;

              return (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between py-1.5 sm:py-2">
                    <span className="text-xs sm:text-[13px] text-neutral-600">Avg Gap vs Market</span>
                    <span className={`text-sm sm:text-[15px] font-bold ${avgGap >= 0 ? 'text-sage-600' : 'text-rose-600'}`}>
                      {avgGap >= 0 ? '+' : ''}{avgGap}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 sm:py-2">
                    <span className="text-xs sm:text-[13px] text-neutral-600">Days Underpriced</span>
                    <span className="text-sm sm:text-[15px] font-bold text-sage-600">
                      {underpricedDays}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 sm:py-2">
                    <span className="text-xs sm:text-[13px] text-neutral-600">Days Overpriced</span>
                    <span className="text-sm sm:text-[15px] font-bold text-rose-600">
                      {overpricedDays}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 sm:py-2 border-t border-neutral-100 pt-2 sm:pt-3">
                    <span className="text-xs sm:text-[13px] text-neutral-600">Revenue Opportunity</span>
                    <span className="text-sm sm:text-[15px] font-bold text-gold-600">
                      ${totalOpportunity.toLocaleString()}
                    </span>
                  </div>
                  <Link to="/admin/revenue/competitors" className="block">
                    <Button variant="outline" size="sm" fullWidth className="text-xs sm:text-sm">
                      View Analysis
                    </Button>
                  </Link>
                </div>
              );
            })()}
          </section>

          {/* Pickup Summary */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">Pickup Summary</h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">Booking pace</p>
            </div>
            {isLoading ? (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-5 sm:h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-xs sm:text-[13px] text-neutral-600">Strong Pace Days (7d)</span>
                  <span className="text-sm sm:text-[15px] font-bold text-sage-600">
                    {pickupMetrics?.strong_days || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-xs sm:text-[13px] text-neutral-600">Critical Pace Days</span>
                  <span className="text-sm sm:text-[15px] font-bold text-rose-600">
                    {pickupMetrics?.critical_days || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 sm:py-2">
                  <span className="text-xs sm:text-[13px] text-neutral-600">Rooms to Sell (7d)</span>
                  <span className="text-sm sm:text-[15px] font-bold text-neutral-800">
                    {pickupMetrics?.total_remaining || 0}
                  </span>
                </div>
                <Link to="/admin/revenue/pickup" className="block mt-1.5 sm:mt-2">
                  <Button variant="outline" size="sm" fullWidth className="text-xs sm:text-sm">
                    View Analysis
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* AI Insights Summary Card */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">AI Insights</h3>
              <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider bg-gold-100 text-gold-700">
                Smart
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium">
              Automated pricing recommendations
            </p>
          </div>
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {isLoading ? (
              <SkeletonLoader className="h-20 sm:h-24 w-full rounded-lg" />
            ) : recommendations.length === 0 ? (
              <div className="p-3 sm:p-4 rounded-lg bg-sage-50 border border-sage-100 text-center">
                <p className="text-xs sm:text-[13px] font-medium text-sage-700">All Optimized!</p>
                <p className="text-[10px] sm:text-[11px] text-sage-600 mt-1">No pending recommendations</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Summary Stats */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex-1 p-2.5 sm:p-3 rounded-lg bg-terra-50 border border-terra-100">
                    <p className="text-[9px] sm:text-[10px] text-terra-600 font-medium uppercase tracking-wide">
                      Recommendations
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-terra-700">
                      {recommendations.length}
                    </p>
                  </div>
                  <div className="flex-1 p-2.5 sm:p-3 rounded-lg bg-sage-50 border border-sage-100">
                    <p className="text-[9px] sm:text-[10px] text-sage-600 font-medium uppercase tracking-wide">
                      Potential Revenue
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-sage-700">
                      +${totalOpportunity.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Priority Badges */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {recommendations.filter(r => r.priority === 'critical').length > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide rounded-full bg-rose-100 text-rose-700">
                      {recommendations.filter(r => r.priority === 'critical').length} Critical
                    </span>
                  )}
                  {recommendations.filter(r => r.priority === 'high').length > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wide rounded-full bg-gold-100 text-gold-700">
                      {recommendations.filter(r => r.priority === 'high').length} High
                    </span>
                  )}
                </div>

                {/* Link to Rate Calendar */}
                <Link to="/admin/revenue/calendar">
                  <Button variant="outline" size="sm" fullWidth iconRight={ChevronRight} className="text-xs sm:text-sm">
                    View in Rate Calendar
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Refresh Confirmation Dialog */}
      <ConfirmModal
        open={showRefreshConfirm}
        onClose={() => setShowRefreshConfirm(false)}
        onConfirm={handleRefreshAll}
        title="Refresh All Data?"
        description="This will refresh all pricing rules, forecasts, and recommendations. Any unsaved manual adjustments may be overwritten."
        confirmText="Refresh"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Export Options Dialog */}
      <Modal open={showExportOptions} onClose={() => setShowExportOptions(false)} size="md">
        <ModalHeader>
          <ModalTitle className="text-base sm:text-lg">Export Dashboard</ModalTitle>
          <ModalDescription className="text-xs sm:text-sm">Choose your preferred export format</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <button
              onClick={exportToCSV}
              className="p-3 sm:p-5 rounded-lg border border-neutral-200 hover:border-terra-300 hover:bg-terra-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-terra-50 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-terra-600" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-neutral-800">CSV File</span>
                <span className="text-[10px] sm:text-[11px] text-center text-neutral-500">
                  Spreadsheet format
                </span>
              </div>
            </button>
            <button
              onClick={exportToPDF}
              className="p-3 sm:p-5 rounded-lg border border-neutral-200 hover:border-terra-300 hover:bg-terra-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center gap-1.5 sm:gap-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-terra-50 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                  <Download className="w-4 h-4 sm:w-5 sm:h-5 text-terra-600" />
                </div>
                <span className="text-xs sm:text-[13px] font-semibold text-neutral-800">PDF Report</span>
                <span className="text-[10px] sm:text-[11px] text-center text-neutral-500">
                  Formatted report
                </span>
              </div>
            </button>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowExportOptions(false)} className="text-xs sm:text-sm">
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Custom Date Range Picker Dialog */}
      <Modal open={showDatePicker} onClose={() => setShowDatePicker(false)} size="sm">
        <ModalHeader>
          <ModalTitle className="text-base sm:text-lg">Select Date Range</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange,
                  start: new Date(e.target.value)
                })}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 text-xs sm:text-[13px] text-neutral-800 focus:border-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1.5 sm:mb-2">
                End Date
              </label>
              <input
                type="date"
                value={customDateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange,
                  end: new Date(e.target.value)
                })}
                min={customDateRange.start.toISOString().split('T')[0]}
                className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-neutral-200 text-xs sm:text-[13px] text-neutral-800 focus:border-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-100 transition-colors"
              />
            </div>
            <div className="p-2.5 sm:p-3 rounded-lg bg-terra-50">
              <p className="text-xs sm:text-[13px] text-terra-700 font-medium">
                Selected range: <span className="font-semibold">{getPeriodDays()} days</span>
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDatePicker(false)} className="text-xs sm:text-sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCustomDateApply} className="text-xs sm:text-sm">
            Apply
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RevenueDashboard;
