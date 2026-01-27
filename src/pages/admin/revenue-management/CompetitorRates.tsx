import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Globe, RefreshCw, AlertTriangle, CheckCircle, Users, ChevronDown, Check, Calendar, Database, WifiOff } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import { useToast } from '../../../contexts/ToastContext';
import CompetitorRateTable, { CompetitorCard } from '../../../components/revenue-management/CompetitorRateTable';
import { competitors as competitorList } from '../../../data/rms/sampleCompetitors';
import { Button } from '../../../components/ui2/Button';

const CompetitorRates = () => {
  const { success, error: showError } = useToast();
  const {
    competitors,
    competitorInsights,
    parityIssues,
    updateCompetitorRates,
    detectUnderpricing,
    detectOverpricing,
  } = useRMS();

  const [dateRange, setDateRange] = useState(14);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const dropdownRef = useRef(null);
  const dateRangeRef = useRef(null);

  // Initial loading simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
        setIsDateRangeOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for dropdown
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleKeyDown = (event) => {
      const dates = Object.keys(competitors).slice(0, 14);
      const currentIndex = dates.indexOf(selectedDate);

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (currentIndex < dates.length - 1) {
            setSelectedDate(dates[currentIndex + 1]);
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (currentIndex > 0) {
            setSelectedDate(dates[currentIndex - 1]);
          }
          break;
        case 'Enter':
          event.preventDefault();
          setIsDropdownOpen(false);
          break;
        case 'Escape':
          event.preventDefault();
          setIsDropdownOpen(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, selectedDate, competitors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setHasError(false);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // Simulate potential error (remove in production)
      // if (Math.random() < 0.1) throw new Error('Network error');
      updateCompetitorRates();
      success('Competitor rates refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh rates:', error);
      setHasError(true);
      showError('Failed to refresh competitor rates. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const underpricedDays = detectUnderpricing();
  const overpricedDays = detectOverpricing();

  // Empty State Component
  const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="bg-white rounded-[10px] p-8 sm:p-12 text-center">
      <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-lg flex items-center justify-center mb-3 sm:mb-4 bg-terra-50">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-terra-500" />
      </div>
      <h3 className="text-sm sm:text-[15px] font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-xs sm:text-[13px] text-neutral-500 mb-4 sm:mb-6">{description}</p>
      {action}
    </div>
  );

  // Error State Component
  const ErrorState = () => (
    <EmptyState
      icon={WifiOff}
      title="Unable to Load Competitor Data"
      description="We couldn't fetch the latest competitor rates. Please check your connection and try again."
      action={
        <Button onClick={handleRefresh} loading={isRefreshing} variant="primary">
          {isRefreshing ? 'Retrying...' : 'Retry'}
        </Button>
      }
    />
  );

  // Check for empty data
  const hasCompetitorData = competitorList && competitorList.length > 0;
  const hasRateData = competitors && Object.keys(competitors).length > 0;

  // Skeleton Loader for KPI Cards
  const SkeletonKPICard = ({ index = 0 }) => (
    <div
      className="bg-white rounded-[10px] p-3 sm:p-5 animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="mb-2 sm:mb-3">
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-neutral-100" />
      </div>
      <div className="h-2.5 w-14 sm:w-20 rounded bg-neutral-100 mb-1.5 sm:mb-2" />
      <div className="h-5 sm:h-7 w-12 sm:w-16 rounded bg-neutral-100" />
    </div>
  );

  // KPI Card Component - Consistent with Design System
  const KPICard = ({ title, value, icon: Icon, accentColor = 'terra', index = 0, subtitle }) => {
    const accentStyles = {
      terra: { bg: 'bg-terra-50', icon: 'text-terra-600' },
      sage: { bg: 'bg-sage-50', icon: 'text-sage-600' },
      gold: { bg: 'bg-gold-50', icon: 'text-gold-600' },
      ocean: { bg: 'bg-ocean-50', icon: 'text-ocean-600' },
      rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
    };

    const style = accentStyles[accentColor] || accentStyles.terra;

    return (
      <div
        className="rounded-[10px] bg-white p-3 sm:p-5"
        style={{ animationDelay: `${index * 100}ms` }}
      >
        <div className="flex items-start justify-between mb-2 sm:mb-3">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${style.bg}`}>
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${style.icon}`} />
          </div>
        </div>
        <p className="text-[8px] sm:text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1 truncate">
          {title}
        </p>
        <p className="text-base sm:text-xl font-semibold tracking-tight text-neutral-900">
          {value}
        </p>

        {subtitle && (
          <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
            Competitor Rate Shopper
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-500 mt-1">
            Monitor competitor pricing and optimize your rate positioning
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-2 sm:px-4 py-1.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all duration-200 ${
                  dateRange === days
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                <span className="sm:hidden">{days}d</span>
                <span className="hidden sm:inline">{days} Days</span>
              </button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={RefreshCw}
            variant="primary"
          >
            <span className="hidden sm:inline">Refresh Rates</span>
          </Button>
        </div>
      </header>

      {/* Summary Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        {isInitialLoading ? (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonKPICard key={i} index={i} />
            ))}
          </>
        ) : competitorInsights ? (
          <>
            <KPICard
              title="Avg Gap vs Market"
              value={`${(competitorInsights?.avgGapPercent || 0) > 0 ? '+' : ''}${competitorInsights?.avgGapPercent || 0}%`}
              icon={(competitorInsights?.avgGapPercent || 0) < 0 ? TrendingDown : (competitorInsights?.avgGapPercent || 0) > 0 ? TrendingUp : Globe}
              accentColor={(competitorInsights?.avgGapPercent || 0) < 0 ? 'sage' : (competitorInsights?.avgGapPercent || 0) > 0 ? 'rose' : 'terra'}
              index={0}
            />
            <KPICard
              title="Days at Market"
              value={competitorInsights?.atMarketDays || 0}
              icon={CheckCircle}
              accentColor="sage"
              index={1}
            />
            <KPICard
              title="Days Underpriced"
              value={competitorInsights?.underpricedDays || 0}
              icon={TrendingDown}
              accentColor="sage"
              index={2}
            />
            <KPICard
              title="Days Overpriced"
              value={competitorInsights?.overpricedDays || 0}
              icon={TrendingUp}
              accentColor="rose"
              index={3}
            />
            <KPICard
              title="Revenue Opportunity"
              value={`$${(competitorInsights?.potentialRevenueLoss || 0).toLocaleString()}`}
              icon={AlertTriangle}
              accentColor="gold"
              index={4}
            />
          </>
        ) : null}
      </section>

      {/* Recommendations */}
      {competitorInsights?.recommendations && Array.isArray(competitorInsights.recommendations) && competitorInsights.recommendations.length > 0 && (
        <section className="p-3 sm:p-5 rounded-[10px] bg-gold-50 border border-gold-200">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gold-100">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold text-gold-800 mb-2">
                Rate Strategy Recommendations
              </h3>
              <ul className="space-y-2">
                {competitorInsights.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="text-[11px] sm:text-[13px] flex items-start gap-2 text-gold-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-500 mt-1.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Main Rate Table */}
      {hasError ? (
        <section>
          <ErrorState />
        </section>
      ) : !hasRateData ? (
        <section>
          <EmptyState
            icon={Database}
            title="No Competitor Data Available"
            description="There's no rate data available for the selected date range. Please try refreshing or selecting a different date range."
            action={
              <Button onClick={handleRefresh} loading={isRefreshing} variant="primary">
                {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            }
          />
        </section>
      ) : (
        <>
          <section>
            <CompetitorRateTable dateRange={dateRange} />
          </section>

          {/* Competitor Cards */}
          {!hasCompetitorData ? (
            <EmptyState
              icon={Users}
              title="No Competitor Profiles"
              description="No competitor hotels have been configured. Please add competitor profiles to start tracking rates."
              action={null}
            />
          ) : (
            <section className="rounded-[10px] bg-white overflow-hidden">
              <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-neutral-800">Competitor Profiles</h3>
                  <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">
                    Compare rates across {competitorList.length} competitor hotels
                  </p>
                </div>
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    aria-label="Select date for competitor comparison"
                    aria-haspopup="listbox"
                    aria-expanded={isDropdownOpen}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 bg-white hover:border-neutral-300 transition-all w-full sm:w-auto justify-between sm:justify-start"
                  >
                    <Calendar className="w-4 h-4 text-terra-500" />
                    <span className="text-xs sm:text-[13px] font-medium text-neutral-900">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div
                      role="listbox"
                      aria-label="Select date"
                      className="absolute right-0 mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg overflow-hidden z-50"
                    >
                      <div className="max-h-80 overflow-y-auto p-2">
                        {Object.keys(competitors).slice(0, 14).map(date => (
                          <button
                            key={date}
                            role="option"
                            aria-selected={selectedDate === date}
                            onClick={() => {
                              setSelectedDate(date);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-[13px] font-medium rounded-lg transition-all ${
                              selectedDate === date
                                ? 'bg-terra-50 text-terra-700'
                                : 'text-neutral-700 hover:bg-neutral-50'
                            }`}
                          >
                            <span>
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            {selectedDate === date && (
                              <Check className="w-4 h-4" aria-hidden="true" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="px-4 sm:px-6 pb-4 sm:pb-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {competitorList.map(comp => (
                  <CompetitorCard
                    key={comp.id}
                    competitor={comp}
                    date={selectedDate}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      </main>
    </div>
  );
};

export default CompetitorRates;
