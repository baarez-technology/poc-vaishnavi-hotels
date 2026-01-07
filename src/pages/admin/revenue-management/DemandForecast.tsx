import { useState } from 'react';
import { TrendingUp, Flame, Snowflake, RefreshCw, Sparkles } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import DemandChart, { DemandLevelBadge, ForecastSummaryCards } from '../../../components/revenue-management/DemandChart';
import { Button } from '../../../components/ui2/Button';

const DemandForecast = () => {
  const {
    forecast,
    forecastSummary,
    forecastInsights,
    highImpactDays,
    opportunityDays,
    runForecast,
    simulateDemandSurge,
    simulateDemandDrop,
  } = useRMS();

  const [dateRange, setDateRange] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSimulation, setSelectedSimulation] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runForecast();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSimulateSurge = (date) => {
    simulateDemandSurge(date, 1.35);
    setSelectedSimulation({ date, type: 'surge' });
  };

  const handleSimulateDrop = (date) => {
    simulateDemandDrop(date, 0.65);
    setSelectedSimulation({ date, type: 'drop' });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Demand Forecast
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            AI-powered demand predictions and pricing recommendations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
            {[14, 30, 60, 90].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                  dateRange === days
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                {days}D
              </button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={RefreshCw}
            variant="primary"
          >
            Regenerate
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ForecastSummaryCards />
      </section>

      {/* AI Insights */}
      {forecastInsights.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forecastInsights.map((insight, index) => (
            <div
              key={index}
              className={`p-5 rounded-[10px] border transition-colors ${
                insight.type === 'compression'
                  ? 'bg-rose-50 border-rose-200'
                  : insight.type === 'weak_demand'
                    ? 'bg-gold-50 border-gold-200'
                    : 'bg-ocean-50 border-ocean-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  insight.type === 'compression'
                    ? 'bg-rose-100'
                    : insight.type === 'weak_demand'
                      ? 'bg-gold-100'
                      : 'bg-ocean-100'
                }`}>
                  {insight.type === 'compression' ? (
                    <Flame className="w-5 h-5 text-rose-600" />
                  ) : insight.type === 'weak_demand' ? (
                    <Snowflake className="w-5 h-5 text-gold-600" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-ocean-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold mb-1 ${
                    insight.type === 'compression'
                      ? 'text-rose-800'
                      : insight.type === 'weak_demand'
                        ? 'text-gold-800'
                        : 'text-ocean-800'
                  }`}>
                    {insight.title}
                  </h4>
                  <p className="text-[13px] text-neutral-600 leading-relaxed">
                    {insight.message}
                  </p>
                  {insight.potentialRevenue && (
                    <p className="text-[13px] font-semibold text-sage-600 mt-2 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      +${insight.potentialRevenue.toLocaleString()} potential
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Chart */}
      <section className="rounded-[10px] bg-white overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Demand Forecast Chart</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Predicted demand trends and occupancy levels
            </p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <DemandChart dateRange={dateRange} />
        </div>
      </section>

      {/* High Impact & Opportunity Days */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* High Impact Days */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-neutral-800">High Impact Days</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Peak demand periods requiring attention
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {highImpactDays.slice(0, 5).map((day) => (
              <div
                key={day.date}
                className="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-neutral-900">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <DemandLevelBadge level={day.demandLevel} />
                  </div>
                  <span className="text-[15px] font-bold text-rose-600">
                    {Math.round(day.demandIndex * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">
                    {day.event ? day.event.name : 'High demand expected'}
                  </span>
                  <span className="text-neutral-600 font-medium">
                    {day.forecast.occupancy}% occ • ${day.forecast.adr} ADR
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-sage-600">
                    {day.priceRecommendation.message}
                  </span>
                  <button
                    onClick={() => handleSimulateSurge(day.date)}
                    className="px-2 py-1 text-[11px] font-medium text-terra-600 hover:bg-terra-50 rounded transition-colors"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Opportunity Days */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-neutral-800">Opportunity Days</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Low demand periods needing promotional strategies
            </p>
          </div>
          <div className="px-6 pb-6 space-y-3">
            {opportunityDays.slice(0, 5).map((day) => (
              <div
                key={day.date}
                className="p-4 rounded-lg border border-neutral-100 bg-neutral-50/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-neutral-900">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <DemandLevelBadge level={day.demandLevel} />
                  </div>
                  <span className="text-[15px] font-bold text-gold-600">
                    {Math.round(day.demandIndex * 100)}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-neutral-500">
                    Low demand expected
                  </span>
                  <span className="text-neutral-600 font-medium">
                    {day.forecast.occupancy}% occ • ${day.forecast.adr} ADR
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-dashed border-neutral-200 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-gold-600">
                    {day.priceRecommendation.message}
                  </span>
                  <button
                    onClick={() => handleSimulateDrop(day.date)}
                    className="px-2 py-1 text-[11px] font-medium text-terra-600 hover:bg-terra-50 rounded transition-colors"
                  >
                    Simulate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </main>
    </div>
  );
};

export default DemandForecast;
