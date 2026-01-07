import { useState, useEffect } from 'react';
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
import { useRMS } from '../../../context/RMSContext';
import { useToast } from '../../../contexts/ToastContext';
import { DemandLevelBadge } from '../../../components/revenue-management/DemandChart';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter, ConfirmModal } from '../../../components/ui2/Modal';
import { Button } from '../../../components/ui2/Button';

// Skeleton Loader Component
function SkeletonLoader({ className = '' }) {
  return (
    <div className={`animate-pulse bg-neutral-100 ${className}`} />
  );
}

// KPI Card Component - Consistent with Design System
function KPICard({ title, value, trendValue, icon: Icon, accentColor = 'terra', index = 0, children, isLoading, subtitle }) {
  const isPositive = trendValue >= 0;

  const accentStyles = {
    terra: { bg: 'bg-terra-50', icon: 'text-terra-600' },
    sage: { bg: 'bg-sage-50', icon: 'text-sage-600' },
    gold: { bg: 'bg-gold-50', icon: 'text-gold-600' },
    ocean: { bg: 'bg-ocean-50', icon: 'text-ocean-600' },
  };

  const style = accentStyles[accentColor] || accentStyles.terra;

  if (isLoading) {
    return (
      <div className="rounded-[10px] bg-white p-6" style={{ animationDelay: `${index * 100}ms` }}>
        <div className="flex items-center gap-3 mb-4">
          <SkeletonLoader className="h-8 w-8 rounded-lg" />
          <SkeletonLoader className="h-4 w-24" />
        </div>
        <SkeletonLoader className="h-9 w-32 mb-2" />
        <SkeletonLoader className="h-5 w-28" />
      </div>
    );
  }

  return (
    <div
      className="relative overflow-hidden rounded-[10px] bg-white p-6"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Icon className={`w-4 h-4 ${style.icon}`} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          {title}
        </p>
      </div>

      {/* Value */}
      <p className="text-[28px] font-semibold tracking-tight text-neutral-900 mb-2">
        {value}
      </p>

      {/* Comparison */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-neutral-400 font-medium">{subtitle || 'vs Last Week'}</p>
        {trendValue !== null && trendValue !== undefined ? (
          <div className={`flex items-center gap-1 text-[11px] font-semibold ${
            isPositive ? 'text-sage-600' : 'text-rose-600'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {isPositive ? '+' : ''}{trendValue}%
          </div>
        ) : children}
      </div>
    </div>
  );
}

const RevenueDashboard = () => {
  const { showToast } = useToast();
  const {
    rateCalendar,
    forecastSummary,
    highImpactDays,
    pickupMetrics,
    competitorInsights,
    segmentComparison,
    recommendations,
    rules,
    runAllRules,
    generateRecommendations,
  } = useRMS();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timePeriod, setTimePeriod] = useState('7d');
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
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
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      runAllRules();
      generateRecommendations();
      setLastUpdated(new Date());
      showToast('Dashboard data refreshed successfully', 'success');
    } catch (error) {
      showToast('Failed to refresh dashboard data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    try {
      showToast('Generating CSV export...', 'info');

      // Prepare CSV data
      const csvData = [];

      // Add headers
      csvData.push(['Revenue Management Dashboard Export']);
      csvData.push(['Generated:', new Date().toLocaleString()]);
      csvData.push(['Period:', `${getPeriodDays()} Days`]);
      csvData.push([]);

      // KPIs Section
      csvData.push(['KEY METRICS']);
      csvData.push(['Metric', 'Value', 'Change']);
      csvData.push([
        `${getPeriodDays()}-Day Revenue`,
        `$${getPeriodRevenue().toLocaleString()}`,
        `${forecastSummary.next7Days?.revenueTrend || 0}%`
      ]);
      csvData.push([
        'Avg Occupancy',
        `${forecastSummary.next7Days?.avgOccupancy || 0}%`,
        `${forecastSummary.next7Days?.occupancyTrend || 0}%`
      ]);
      csvData.push([
        'Avg ADR',
        `$${forecastSummary.next7Days?.avgADR || 0}`,
        `${forecastSummary.next7Days?.adrTrend || 0}%`
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
      csvData.push(['HIGH DEMAND DAYS']);
      csvData.push(['Date', 'Demand Level', 'Occupancy %']);
      highImpactDays.slice(0, 5).forEach(day => {
        const date = new Date(day.date).toLocaleDateString('en-US', {
          weekday: 'short', month: 'short', day: 'numeric'
        });
        csvData.push([date, day.demandLevel, `${day.occupancy}%`]);
      });
      csvData.push([]);

      // Market Position
      csvData.push(['MARKET POSITION']);
      csvData.push(['Metric', 'Value']);
      csvData.push(['Avg Gap vs Market', `${competitorInsights.avgGapPercent}%`]);
      csvData.push(['Days Underpriced', competitorInsights.daysUnderpriced]);
      csvData.push(['Days Overpriced', competitorInsights.daysOverpriced]);
      csvData.push(['Revenue Opportunity', `$${competitorInsights.revenueOpportunity?.toLocaleString()}`]);
      csvData.push([]);

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

      // Create a simple HTML-based PDF export using print
      const printWindow = window.open('', '', 'width=800,height=600');

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
              <div class="kpi-trend ${(forecastSummary.next7Days?.revenueTrend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(forecastSummary.next7Days?.revenueTrend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(forecastSummary.next7Days?.revenueTrend || 0)}%
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg Occupancy</div>
              <div class="kpi-value">${forecastSummary.next7Days?.avgOccupancy || 0}%</div>
              <div class="kpi-trend ${(forecastSummary.next7Days?.occupancyTrend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(forecastSummary.next7Days?.occupancyTrend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(forecastSummary.next7Days?.occupancyTrend || 0)}%
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Avg ADR</div>
              <div class="kpi-value">$${forecastSummary.next7Days?.avgADR || 0}</div>
              <div class="kpi-trend ${(forecastSummary.next7Days?.adrTrend || 0) >= 0 ? 'positive' : 'negative'}">
                ${(forecastSummary.next7Days?.adrTrend || 0) >= 0 ? '↑' : '↓'} ${Math.abs(forecastSummary.next7Days?.adrTrend || 0)}%
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
              ${highImpactDays.slice(0, 5).map(day => {
                const date = new Date(day.date).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                });
                return `
                  <tr>
                    <td>${date}</td>
                    <td>${day.demandLevel}</td>
                    <td>${day.occupancy}%</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h2>Market Position</h2>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Avg Gap vs Market</td>
                <td class="${competitorInsights.avgGapPercent < 0 ? 'positive' : 'negative'}">${competitorInsights.avgGapPercent}%</td>
              </tr>
              <tr>
                <td>Days Underpriced</td>
                <td>${competitorInsights.daysUnderpriced}</td>
              </tr>
              <tr>
                <td>Days Overpriced</td>
                <td>${competitorInsights.daysOverpriced}</td>
              </tr>
              <tr>
                <td>Revenue Opportunity</td>
                <td>$${competitorInsights.revenueOpportunity?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

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
    const diffMs = now - lastUpdated;
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
    switch (timePeriod) {
      case '30d':
        return forecastSummary.next30Days?.totalRevenue || 0;
      case '90d':
        return (forecastSummary.next30Days?.totalRevenue || 0) * 3;
      case 'custom': {
        // Calculate based on custom date range
        const days = Math.ceil((customDateRange.end - customDateRange.start) / (1000 * 60 * 60 * 24));
        const dailyAvg = (forecastSummary.next30Days?.totalRevenue || 0) / 30;
        return Math.round(dailyAvg * days);
      }
      case '7d':
      default:
        return forecastSummary.next7Days?.totalRevenue || 0;
    }
  };

  const getPeriodDays = () => {
    switch (timePeriod) {
      case '30d': return 30;
      case '90d': return 90;
      case 'custom': {
        const days = Math.ceil((customDateRange.end - customDateRange.start) / (1000 * 60 * 60 * 24));
        return days;
      }
      case '7d':
      default: return 7;
    }
  };

  const handlePeriodChange = (value) => {
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

  // Chart data for revenue trend
  const revenueChartData = Object.entries(rateCalendar)
    .slice(0, 14)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.round(data.occupancy * 70 * (data.rooms?.STD?.dynamicRate || 200)),
      occupancy: data.occupancy,
    }));

  // Segment pie data
  const segmentPieData = Object.values(segmentComparison?.byRevenue || []).slice(0, 5).map(seg => ({
    name: seg.segmentName,
    value: seg.metrics.revenueContribution,
    color: seg.segmentColor,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6 space-y-6">

        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Revenue Management
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">
              AI-powered pricing optimization • Updated {getLastUpdatedText()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Time Period Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodChange(option.value)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                    timePeriod === option.value
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Export Button */}
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExport}
            >
              Export
            </Button>

            {/* Refresh Button */}
            <Button
              variant="primary"
              icon={RefreshCw}
              onClick={() => setShowRefreshConfirm(true)}
              disabled={isRefreshing}
              loading={isRefreshing}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </header>

        {/* Alerts Banner */}
        {(criticalAlerts > 0 || highAlerts > 0) && !isLoading && (
          <div className={`rounded-[10px] p-4 flex items-center justify-between ${
            criticalAlerts > 0 ? 'bg-rose-50' : 'bg-gold-50'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                criticalAlerts > 0 ? 'bg-rose-100' : 'bg-gold-100'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${criticalAlerts > 0 ? 'text-rose-600' : 'text-gold-600'}`} />
              </div>
              <div>
                <p className={`text-[13px] font-semibold ${
                  criticalAlerts > 0 ? 'text-rose-800' : 'text-gold-800'
                }`}>
                  {criticalAlerts + highAlerts} Pricing Action{criticalAlerts + highAlerts !== 1 ? 's' : ''} Needed
                </p>
                <p className="text-[11px] text-neutral-500 font-medium">
                  {criticalAlerts > 0 && `${criticalAlerts} critical`}
                  {criticalAlerts > 0 && highAlerts > 0 && ', '}
                  {highAlerts > 0 && `${highAlerts} high priority`}
                </p>
              </div>
            </div>
            <Link
              to="/admin/rms/calendar"
              className={`px-4 py-2 text-[13px] font-semibold rounded-lg text-white transition-colors ${
                criticalAlerts > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gold-600 hover:bg-gold-700'
              }`}
            >
              Take Action
            </Link>
          </div>
        )}

        {/* Key Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title={`${getPeriodDays()}-Day Revenue`}
            value={`$${(getPeriodRevenue() / 1000).toFixed(0)}K`}
            trendValue={12}
            icon={DollarSign}
            accentColor="sage"
            index={0}
            isLoading={isLoading}
            subtitle="Projected revenue"
          />

          <KPICard
            title="Avg Occupancy"
            value={`${forecastSummary.next7Days?.avgOccupancy || 0}%`}
            trendValue={forecastSummary.next7Days?.avgOccupancy >= 75 ? 3.2 : -1.5}
            icon={BarChart3}
            accentColor="terra"
            index={1}
            isLoading={isLoading}
            subtitle="Next 7 days"
          />

          <KPICard
            title="Avg ADR"
            value={`$${forecastSummary.next7Days?.avgADR || 0}`}
            trendValue={8}
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
              to="/admin/rms/rules"
              className="text-[11px] font-semibold text-terra-600 flex items-center gap-1"
            >
              View All <ChevronRight className="w-3 h-3" />
            </Link>
          </KPICard>
        </section>

        {/* Revenue Forecast Chart - Full Width */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">Revenue & Occupancy Forecast</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">14-day outlook</p>
            </div>
            <div className="flex items-center gap-4">
              {/* Legend */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-sage-500" />
                  <span className="text-[11px] text-neutral-600 font-medium">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-terra-500" style={{ borderStyle: 'dashed', borderWidth: '1.5px', borderColor: '#A57865' }} />
                  <span className="text-[11px] text-neutral-600 font-medium">Occupancy</span>
                </div>
              </div>
              <Link to="/admin/rms/forecast">
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Summary Stats */}
          {!isLoading && (
            <div className="px-6 pb-4 grid grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-[11px] text-neutral-400 font-medium">Total Projected</p>
                <p className="text-lg font-semibold text-neutral-800">
                  ${(revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(0)}K
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-[11px] text-neutral-400 font-medium">Avg Daily Revenue</p>
                <p className="text-lg font-semibold text-neutral-800">
                  ${(revenueChartData.reduce((sum, d) => sum + d.revenue, 0) / revenueChartData.length / 1000).toFixed(1)}K
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-[11px] text-neutral-400 font-medium">Avg Occupancy</p>
                <p className="text-lg font-semibold text-neutral-800">
                  {(revenueChartData.reduce((sum, d) => sum + d.occupancy, 0) / revenueChartData.length).toFixed(0)}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-neutral-50">
                <p className="text-[11px] text-neutral-400 font-medium">Peak Day</p>
                <p className="text-lg font-semibold text-sage-600">
                  {revenueChartData.length > 0 ? revenueChartData.reduce((max, d) => d.revenue > max.revenue ? d : max, revenueChartData[0]).date : '-'}
                </p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="px-6 pb-6">
              <SkeletonLoader className="h-80 w-full rounded-lg" />
            </div>
          ) : (
            <div className="h-80 px-6 pb-6">
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
                    formatter={(value, name) => [
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
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">High Demand Days</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Peak occupancy opportunities</p>
            </div>
            <Link to="/admin/rms/forecast">
              <Button variant="ghost" size="sm">
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-5 gap-3 px-6 pb-6">
              {[...Array(5)].map((_, i) => (
                <SkeletonLoader key={i} className="h-28 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3 px-6 pb-6">
              {highImpactDays.slice(0, 5).map((day, index) => (
                <div
                  key={day.date}
                  className="p-3 rounded-lg bg-rose-50 border border-rose-100 text-center hover:bg-rose-100 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="text-[11px] text-neutral-500 font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold text-neutral-800">
                    {new Date(day.date).getDate()}
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short' })}
                  </p>
                  <div className="flex justify-center mt-1">
                    <DemandLevelBadge level={day.demandLevel} />
                  </div>
                  <p className="text-[13px] font-bold text-rose-600 mt-1">
                    {day.forecast.occupancy}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Three Column Grid: Segment, Market Position, Pickup Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Segment Pie Chart */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-neutral-800">Revenue by Segment</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Top 5 segments</p>
            </div>
            {isLoading ? (
              <div className="px-6 pb-6">
                <SkeletonLoader className="h-48 w-full rounded-lg" />
              </div>
            ) : (
              <div className="px-6 pb-6">
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={segmentPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {segmentPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        formatter={(value) => [`${value}%`, 'Share']}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #E5E4E0',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Segment Indicators */}
                <div className="mt-3 space-y-2">
                  {segmentPieData.slice(0, 5).map((segment, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-[11px] text-neutral-600 truncate max-w-[100px]">
                          {segment.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-neutral-800">
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
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-neutral-800">Market Position</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Competitive analysis</p>
            </div>
            {isLoading ? (
              <div className="px-6 pb-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Avg Gap vs Market</span>
                  <span className={`text-[15px] font-bold ${
                    competitorInsights.avgGapPercent < 0 ? 'text-sage-600' : 'text-rose-600'
                  }`}>
                    {competitorInsights.avgGapPercent > 0 ? '+' : ''}{competitorInsights.avgGapPercent}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Days Underpriced</span>
                  <span className="text-[15px] font-bold text-sage-600">
                    {competitorInsights.underpricedDays}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Days Overpriced</span>
                  <span className="text-[15px] font-bold text-rose-600">
                    {competitorInsights.overpricedDays}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-neutral-100 pt-3">
                  <span className="text-[13px] text-neutral-600">Revenue Opportunity</span>
                  <span className="text-[15px] font-bold text-gold-600">
                    ${competitorInsights.potentialRevenueLoss.toLocaleString()}
                  </span>
                </div>
                <Link to="/admin/rms/competitors" className="block">
                  <Button variant="outline" size="sm" fullWidth>
                    View Analysis
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* Pickup Summary */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <div className="px-6 py-5">
              <h3 className="text-sm font-semibold text-neutral-800">Pickup Summary</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Booking pace</p>
            </div>
            {isLoading ? (
              <div className="px-6 pb-6 space-y-3">
                {[...Array(3)].map((_, i) => (
                  <SkeletonLoader key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Strong Pace Days (7d)</span>
                  <span className="text-[15px] font-bold text-sage-600">
                    {pickupMetrics.next7Days?.strongDays || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Critical Pace Days</span>
                  <span className="text-[15px] font-bold text-rose-600">
                    {pickupMetrics.next7Days?.criticalDays || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[13px] text-neutral-600">Rooms to Sell (7d)</span>
                  <span className="text-[15px] font-bold text-neutral-800">
                    {pickupMetrics.next7Days?.totalRemaining || 0}
                  </span>
                </div>
                <Link to="/admin/rms/pickup" className="block mt-2">
                  <Button variant="outline" size="sm" fullWidth>
                    View Analysis
                  </Button>
                </Link>
              </div>
            )}
          </section>
        </div>

        {/* AI Insights Summary Card */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-neutral-800">AI Insights</h3>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-gold-100 text-gold-700">
                Smart
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-medium">
              Automated pricing recommendations
            </p>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <SkeletonLoader className="h-24 w-full rounded-lg" />
            ) : recommendations.length === 0 ? (
              <div className="p-4 rounded-lg bg-sage-50 border border-sage-100 text-center">
                <p className="text-[13px] font-medium text-sage-700">All Optimized!</p>
                <p className="text-[11px] text-sage-600 mt-1">No pending recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 p-3 rounded-lg bg-terra-50 border border-terra-100">
                    <p className="text-[10px] text-terra-600 font-medium uppercase tracking-wide">
                      Recommendations
                    </p>
                    <p className="text-xl font-bold text-terra-700">
                      {recommendations.length}
                    </p>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-sage-50 border border-sage-100">
                    <p className="text-[10px] text-sage-600 font-medium uppercase tracking-wide">
                      Potential Revenue
                    </p>
                    <p className="text-xl font-bold text-sage-700">
                      +${recommendations.reduce((sum, r) => sum + (r.potentialRevenue || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Priority Badges */}
                <div className="flex items-center gap-2">
                  {recommendations.filter(r => r.priority === 'critical').length > 0 && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-rose-100 text-rose-700">
                      {recommendations.filter(r => r.priority === 'critical').length} Critical
                    </span>
                  )}
                  {recommendations.filter(r => r.priority === 'high').length > 0 && (
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-full bg-gold-100 text-gold-700">
                      {recommendations.filter(r => r.priority === 'high').length} High
                    </span>
                  )}
                </div>

                {/* Link to Rate Calendar */}
                <Link to="/admin/rms/calendar">
                  <Button variant="outline" size="sm" fullWidth iconRight={ChevronRight}>
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
          <ModalTitle>Export Dashboard</ModalTitle>
          <ModalDescription>Choose your preferred export format</ModalDescription>
        </ModalHeader>
        <ModalContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToCSV}
              className="p-5 rounded-lg border border-neutral-200 hover:border-terra-300 hover:bg-terra-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-terra-50 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                  <Download className="w-5 h-5 text-terra-600" />
                </div>
                <span className="text-[13px] font-semibold text-neutral-800">CSV File</span>
                <span className="text-[11px] text-center text-neutral-500">
                  Spreadsheet format
                </span>
              </div>
            </button>
            <button
              onClick={exportToPDF}
              className="p-5 rounded-lg border border-neutral-200 hover:border-terra-300 hover:bg-terra-50 transition-all duration-200 group"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-terra-50 group-hover:bg-terra-100 flex items-center justify-center transition-colors">
                  <Download className="w-5 h-5 text-terra-600" />
                </div>
                <span className="text-[13px] font-semibold text-neutral-800">PDF Report</span>
                <span className="text-[11px] text-center text-neutral-500">
                  Formatted report
                </span>
              </div>
            </button>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowExportOptions(false)}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Custom Date Range Picker Dialog */}
      <Modal open={showDatePicker} onClose={() => setShowDatePicker(false)} size="sm">
        <ModalHeader>
          <ModalTitle>Select Date Range</ModalTitle>
        </ModalHeader>
        <ModalContent>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={customDateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setCustomDateRange({
                  ...customDateRange,
                  start: new Date(e.target.value)
                })}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] text-neutral-800 focus:border-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
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
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 text-[13px] text-neutral-800 focus:border-terra-400 focus:outline-none focus:ring-2 focus:ring-terra-100 transition-colors"
              />
            </div>
            <div className="p-3 rounded-lg bg-terra-50">
              <p className="text-[13px] text-terra-700 font-medium">
                Selected range: <span className="font-semibold">{getPeriodDays()} days</span>
              </p>
            </div>
          </div>
        </ModalContent>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowDatePicker(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCustomDateApply}>
            Apply
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default RevenueDashboard;
