import { useState, useEffect } from 'react';
import { Download, RefreshCw, Sparkles, Target, CheckCircle, Cpu } from 'lucide-react';
import { Button } from '../../components/ui2/Button';

// Import new revenue components
import KPICards from '../../components/revenue/KPICards';
import ForecastChart from '../../components/revenue/ForecastChart';
import ADROccupancyChart from '../../components/revenue/ADROccupancyChart';
import RevenueBySegment from '../../components/revenue/RevenueBySegment';
import UpcomingDemand from '../../components/revenue/UpcomingDemand';
import CompetitorTable from '../../components/revenue/CompetitorTable';
import RateRecommendations from '../../components/revenue/RateRecommendations';
import ControlsBar from '../../components/revenue/ControlsBar';

// Import dummy data
import revenueDataFile from '../../data/dummy/revenueData.json';
import forecastDataFile from '../../data/dummy/forecast.json';
import competitorsDataFile from '../../data/dummy/competitors.json';
import segmentsDataFile from '../../data/dummy/segments.json';

const STORAGE_KEY = 'glimmora_revenue_settings';

export default function RevenueAI() {
  // Settings state with localStorage persistence
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          autoRate: true,
          competitorScan: true,
          demandPricing: false
        };
      }
    }
    return {
      autoRate: true,
      competitorScan: true,
      demandPricing: false
    };
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Persist settings to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastUpdated(new Date());
      setIsRefreshing(false);
    }, 1500);
  };

  const handleExportReport = () => {
    // Generate CSV data
    const csvRows = [
      ['Revenue AI Report', new Date().toLocaleDateString()],
      [],
      ['KPI Metrics'],
      ['Today\'s Revenue', `₹${revenueDataFile.todayRevenue.toLocaleString()}`],
      ['ADR', `₹${revenueDataFile.adr.toLocaleString()}`],
      ['RevPAR', `₹${revenueDataFile.revpar.toLocaleString()}`],
      ['Occupancy', `${revenueDataFile.occupancy}%`],
      ['Forecasted Revenue (7d)', `₹${revenueDataFile.forecastedRevenue.toLocaleString()}`],
      ['Revenue Growth', `${revenueDataFile.revenueGrowth}%`],
      [],
      ['Competitor Analysis'],
      ['Hotel', 'Today Rate', '7-Day Avg', 'Rating', 'Distance'],
      ...competitorsDataFile.map(c => [c.hotel, c.today, c.next7, c.rating, c.distance]),
      [],
      ['Revenue by Segment'],
      ['Segment', 'Revenue', 'Bookings', 'Avg Rate'],
      ...segmentsDataFile.map(s => [s.segment, s.value, s.bookings, s.avgRate])
    ];

    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revenue-report-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Format last updated time
  const getLastUpdatedText = () => {
    const now = new Date();
    const diffMs = now - lastUpdated;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Revenue AI
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sage-100 text-sage-700">
                Smart
              </span>
            </div>
            <p className="text-[13px] text-neutral-500 mt-1">
              AI-powered revenue management & forecasting • Updated {getLastUpdatedText()}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={handleRefresh}
              disabled={isRefreshing}
              loading={isRefreshing}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={Download}
              onClick={handleExportReport}
            >
              Export Report
            </Button>
          </div>
        </header>

        {/* Controls Bar */}
        <section className="rounded-[10px] bg-white p-4">
          <ControlsBar settings={settings} onSettingsChange={handleSettingsChange} />
        </section>

        {/* KPI Cards */}
        <section>
          <KPICards data={revenueDataFile} />
        </section>

        {/* Revenue Forecast Chart */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <ForecastChart data={forecastDataFile} />
        </section>

        {/* ADR + Occupancy Chart */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <ADROccupancyChart data={forecastDataFile} />
        </section>

        {/* Secondary Row - Stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue by Segment */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <RevenueBySegment data={segmentsDataFile} />
          </section>

          {/* Upcoming Demand Heatmap */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <UpcomingDemand data={forecastDataFile} />
          </section>
        </div>

        {/* Competitor Analysis & AI Recommendations - Stacked */}
        <div className="space-y-4">
          {/* Competitor Rate Table */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <CompetitorTable data={competitorsDataFile} yourRate={7800} />
          </section>

          {/* AI Rate Recommendations */}
          <section className="rounded-[10px] bg-white overflow-hidden">
            <RateRecommendations
              forecastData={forecastDataFile}
              competitorData={competitorsDataFile}
              settings={settings}
            />
          </section>
        </div>

        {/* AI Engine Status Footer */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-neutral-800">AI Engine Status</h3>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Real-time optimization metrics</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sage-50">
              <div className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-sage-700">Active</span>
            </div>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-sage-100 flex items-center justify-center">
                    <Cpu className="w-3.5 h-3.5 text-sage-600" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Engine</p>
                </div>
                <p className="text-lg font-bold text-sage-600">Active</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">v2.4.1</p>
              </div>
              <div className="p-4 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-ocean-100 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5 text-ocean-600" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Accuracy</p>
                </div>
                <p className="text-lg font-bold text-ocean-600">94.2%</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Forecast precision</p>
              </div>
              <div className="p-4 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-terra-100 flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-terra-600" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Applied</p>
                </div>
                <p className="text-lg font-bold text-terra-600">12</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Recommendations today</p>
              </div>
              <div className="p-4 rounded-lg bg-neutral-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-gold-100 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">Powered by</p>
                </div>
                <p className="text-lg font-bold text-neutral-900">Glimmora AI</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">ML-driven insights</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
