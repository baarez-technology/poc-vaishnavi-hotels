import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, RefreshCw, Download, Sparkles, TrendingUp, TrendingDown, Clock, AlertTriangle, DollarSign, Users, CheckCircle, Edit3, Copy, ExternalLink, X } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import { useToast } from '../../../contexts/ToastContext';
import RateCalendarView from '../../../components/revenue-management/RateCalendarView';
import { RecommendationsPanel } from '../../../components/revenue-management/RecommendationCard';
import { Button } from '../../../components/ui2/Button';

// KPI Card Component - Consistent with Design System
function KPICard({ title, value, trendValue, icon: Icon, accentColor = 'terra', subtitle, children }) {
  const isPositive = trendValue >= 0;

  const accentStyles = {
    terra: { bg: 'bg-terra-50', icon: 'text-terra-600' },
    sage: { bg: 'bg-sage-50', icon: 'text-sage-600' },
    gold: { bg: 'bg-gold-50', icon: 'text-gold-600' },
    ocean: { bg: 'bg-ocean-50', icon: 'text-ocean-600' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600' },
  };

  const style = accentStyles[accentColor] || accentStyles.terra;

  return (
    <div className="rounded-[10px] bg-white p-6">
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

const RateCalendar = () => {
  const { showToast } = useToast();
  const location = useLocation();
  const {
    rateCalendar,
    roomTypes,
    runAllRules,
    lastRecalculation,
    recommendations,
  } = useRMS();

  const [selectedDate, setSelectedDate] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ rateChange: '', changeType: 'amount' });
  const [competitorSuggestion, setCompetitorSuggestion] = useState(null);

  // Handle navigation from Competitor Rates page
  useEffect(() => {
    if (location.state) {
      const { preselectedDate, suggestedRate, reason, currentRate, marketAvg, marketMin, marketMax } = location.state;

      if (preselectedDate) {
        setSelectedDate(preselectedDate);

        // Show suggestion banner
        if (suggestedRate || marketAvg) {
          setCompetitorSuggestion({
            date: preselectedDate,
            suggestedRate: suggestedRate || marketAvg,
            reason,
            currentRate,
            marketAvg,
            marketMin,
            marketMax,
          });
        }
      }

      // Clear navigation state
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  const handleRecalculateAll = async () => {
    setIsRecalculating(true);
    showToast('Recalculating rates...', 'info');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      runAllRules();
      showToast('Rates recalculated successfully', 'success');
    } catch (error) {
      showToast('Failed to recalculate rates', 'error');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    showToast('Exporting rate calendar...', 'info');
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast('Rate calendar exported successfully', 'success');
    } finally {
      setIsExporting(false);
    }
  };

  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    setSelectedDates([]);
    if (bulkEditMode) {
      showToast('Bulk edit mode disabled', 'info');
    } else {
      showToast('Select dates to apply bulk changes', 'info');
    }
  };

  const handleDateSelection = (date) => {
    if (!bulkEditMode) return;

    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleBulkEdit = () => {
    if (selectedDates.length === 0) {
      showToast('Please select at least one date', 'warning');
      return;
    }
    setShowBulkEditModal(true);
  };

  const applyBulkChanges = () => {
    const { rateChange, changeType } = bulkEditData;
    if (!rateChange || rateChange === '') {
      showToast('Please enter a rate change amount', 'warning');
      return;
    }

    showToast(`Applying ${changeType === 'amount' ? '$' + rateChange : rateChange + '%'} change to ${selectedDates.length} dates...`, 'info');

    // Simulate API call
    setTimeout(() => {
      showToast(`Successfully updated ${selectedDates.length} dates`, 'success');
      setShowBulkEditModal(false);
      setBulkEditMode(false);
      setSelectedDates([]);
      setBulkEditData({ rateChange: '', changeType: 'amount' });
    }, 1000);
  };

  const selectDateRange = (startDate, endDate) => {
    const dates = Object.keys(rateCalendar).filter(date => date >= startDate && date <= endDate);
    setSelectedDates(dates);
    showToast(`Selected ${dates.length} dates from ${startDate} to ${endDate}`, 'success');
  };

  // Calculate summary stats
  const today = new Date().toISOString().split('T')[0];
  const next7Days = Object.entries(rateCalendar)
    .filter(([date]) => date >= today)
    .slice(0, 7);

  const next30Days = Object.entries(rateCalendar)
    .filter(([date]) => date >= today)
    .slice(0, 30);

  const avgOccupancy = Math.round(
    next7Days.reduce((sum, [, data]) => sum + data.occupancy, 0) / next7Days.length
  );

  const avgRate = Math.round(
    next7Days.reduce((sum, [, data]) => sum + (data.rooms?.STD?.dynamicRate || 0), 0) / next7Days.length
  );

  const restrictedDays = next7Days.filter(([, data]) =>
    Object.values(data.rooms || {}).some(r => r.restrictions?.stopSell || r.restrictions?.CTA)
  ).length;

  const totalRevenue = Math.round(
    next7Days.reduce((sum, [, data]) => {
      const dayRevenue = Object.values(data.rooms || {}).reduce((rSum, room) => {
        return rSum + (room.dynamicRate || 0) * (room.sold || 0);
      }, 0);
      return sum + dayRevenue;
    }, 0)
  );

  const criticalRecommendations = recommendations.filter(r => r.priority === 'critical').length;

  // Calculate occupancy trend
  const prevWeekOccupancy = Math.round(
    Object.entries(rateCalendar)
      .filter(([date]) => date >= today)
      .slice(7, 14)
      .reduce((sum, [, data]) => sum + data.occupancy, 0) / 7
  );
  const occupancyChange = avgOccupancy - prevWeekOccupancy;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-10 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Rate Calendar
            </h1>
            <p className="text-[13px] text-neutral-500 mt-1">
              Manage rates, availability, and restrictions • Updated {new Date(lastRecalculation).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {bulkEditMode && selectedDates.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-terra-50 border border-terra-200">
                  <span className="text-[13px] font-medium text-terra-700">
                    {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button
                  variant="success"
                  icon={Edit3}
                  onClick={handleBulkEdit}
                >
                  Apply Changes
                </Button>
              </>
            )}

            <Button
              variant={bulkEditMode ? 'warning' : 'outline'}
              icon={Copy}
              onClick={toggleBulkEditMode}
            >
              {bulkEditMode ? 'Cancel Bulk Edit' : 'Bulk Edit'}
            </Button>

            {!bulkEditMode && (
              <>
                <Button
                  variant="outline"
                  icon={Download}
                  onClick={handleExport}
                  disabled={isExporting}
                  loading={isExporting}
                >
                  Export
                </Button>

                <Button
                  variant="primary"
                  icon={RefreshCw}
                  onClick={handleRecalculateAll}
                  disabled={isRecalculating}
                  loading={isRecalculating}
                >
                  {isRecalculating ? 'Recalculating...' : 'Run All Rules'}
                </Button>
              </>
            )}
          </div>
        </header>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard
            title="Avg Occupancy"
            value={`${avgOccupancy}%`}
            trendValue={occupancyChange}
            icon={Users}
            accentColor="terra"
            subtitle="Next 7 days"
          />

          <KPICard
            title="Avg BAR Rate"
            value={`$${avgRate}`}
            trendValue={null}
            icon={DollarSign}
            accentColor="sage"
            subtitle="Standard room"
          />

          <KPICard
            title="Revenue Forecast"
            value={`$${(totalRevenue / 1000).toFixed(1)}K`}
            trendValue={null}
            icon={TrendingUp}
            accentColor="ocean"
            subtitle="Next 7 days"
          />

          <KPICard
            title="Restrictions"
            value={restrictedDays}
            trendValue={null}
            icon={restrictedDays > 0 ? AlertTriangle : CheckCircle}
            accentColor={restrictedDays > 0 ? 'rose' : 'sage'}
            subtitle={restrictedDays === 1 ? 'Day affected' : 'Days affected'}
          />

          <KPICard
            title="AI Suggestions"
            value={recommendations.length}
            trendValue={null}
            icon={Sparkles}
            accentColor="gold"
            subtitle={criticalRecommendations ? `${criticalRecommendations} critical` : 'All reviewed'}
          />
        </section>

        {/* Competitor Suggestion Banner */}
        {competitorSuggestion && (
          <div className="rounded-[10px] border p-5 bg-gradient-to-r from-terra-50 to-gold-50 border-terra-200">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-terra-100">
                  <ExternalLink className="w-6 h-6 text-terra-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold text-neutral-800">
                      Competitor Analysis Suggestion
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gold-100 text-gold-700">
                      {new Date(competitorSuggestion.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-[12px] text-neutral-600 mt-1">
                    {competitorSuggestion.reason || 'Recommended rate adjustment based on market analysis'}
                  </p>

                  {competitorSuggestion.marketAvg && (
                    <div className="flex items-center gap-6 mt-3">
                      <div>
                        <p className="text-[11px] text-neutral-500 font-medium">Your Rate</p>
                        <p className="text-xl font-bold text-neutral-800">
                          ${competitorSuggestion.currentRate}
                        </p>
                      </div>
                      <div className="text-2xl text-neutral-300">→</div>
                      <div>
                        <p className="text-[11px] text-neutral-500 font-medium">Suggested Rate</p>
                        <p className="text-xl font-bold text-terra-600">
                          ${competitorSuggestion.suggestedRate}
                        </p>
                      </div>
                      <div className="pl-4 border-l border-neutral-200">
                        <p className="text-[11px] text-neutral-500 font-medium">Market Avg</p>
                        <p className="text-lg font-semibold text-neutral-700">
                          ${competitorSuggestion.marketAvg}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-neutral-500 font-medium">Market Range</p>
                        <p className="text-[13px] font-medium text-neutral-600">
                          ${competitorSuggestion.marketMin} - ${competitorSuggestion.marketMax}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => setCompetitorSuggestion(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bulk Edit Mode Banner - Top */}
        {bulkEditMode && (
          <div className="p-4 rounded-[10px] border-2 border-terra-400 bg-terra-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-terra-500 flex items-center justify-center">
                  <Copy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-neutral-900">
                    Bulk Edit Mode Active
                  </p>
                  <p className="text-[12px] text-neutral-600">
                    Click calendar dates to select them for bulk editing
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-terra-500 text-white text-[13px] font-semibold">
                  {selectedDates.length} date{selectedDates.length !== 1 ? 's' : ''} selected
                </div>
                <Button
                  variant="outline"
                  onClick={toggleBulkEditMode}
                >
                  Exit Bulk Edit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Calendar - Full Width */}
        <div className={bulkEditMode ? 'ring-2 ring-terra-400 ring-offset-4 rounded-[10px]' : ''}>
          <RateCalendarView
            onDateSelect={bulkEditMode ? handleDateSelection : setSelectedDate}
            bulkEditMode={bulkEditMode}
            selectedDates={selectedDates}
          />
        </div>

        {/* AI Recommendations - Full Width */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-neutral-800">AI Recommendations</h3>
                {criticalRecommendations > 0 && (
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-rose-100 text-rose-700">
                    {criticalRecommendations} Critical
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Automated pricing insights</p>
            </div>
          </div>
          <div className="px-6 pb-6">
            <RecommendationsPanel limit={4} />
          </div>
        </section>

        {/* Room Type Summary - Full Width */}
        <section className="rounded-[10px] bg-white overflow-hidden">
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-neutral-800">Room Types Today</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Current rates & availability</p>
          </div>
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {roomTypes.map((room, index) => {
                const todayData = rateCalendar[today]?.rooms?.[room.id];
                const rate = todayData?.dynamicRate || room.baseRate;
                const rateChange = rate - room.baseRate;
                const available = todayData?.available || 0;
                const sold = todayData?.sold || 0;
                const occupancyPct = sold > 0 ? Math.round((sold / (sold + available)) * 100) : 0;

                return (
                  <div
                    key={room.id}
                    className="group p-4 rounded-lg border border-neutral-100 bg-neutral-50 hover:bg-white hover:border-neutral-200 transition-colors"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-[13px] font-semibold text-neutral-900">
                          {room.name}
                        </span>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Base: ${room.baseRate}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-neutral-900">
                          ${rate}
                        </p>
                        {rateChange !== 0 && (
                          <p className={`text-[11px] font-semibold ${
                            rateChange > 0 ? 'text-sage-600' : 'text-rose-600'
                          }`}>
                            {rateChange > 0 ? '+' : ''}{rateChange}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          occupancyPct > 80 ? 'bg-sage-500' :
                          occupancyPct > 50 ? 'bg-gold-500' :
                          'bg-neutral-300'
                        }`} />
                        <span className="text-[11px] text-neutral-600">
                          {occupancyPct}% occupied
                        </span>
                      </div>
                      <span className="text-[11px] font-medium text-neutral-700">
                        {available} available
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Bulk Edit Banner */}
        {bulkEditMode && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-neutral-200 shadow-xl rounded-[10px] p-4 flex items-center gap-4 min-w-[400px]">
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-neutral-900">
                Bulk Edit Mode Active
              </p>
              <p className="text-[11px] text-neutral-500">
                Click dates in the calendar to select them
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-terra-50 text-terra-600">
              {selectedDates.length} selected
            </div>
          </div>
        )}

        {/* Bulk Edit Modal */}
        {showBulkEditModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[10px] p-6 bg-white border border-neutral-200 shadow-xl">
              <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                Apply Bulk Changes
              </h3>
              <p className="text-[13px] text-neutral-500 mb-6">
                Update rates for {selectedDates.length} selected date{selectedDates.length !== 1 ? 's' : ''}
              </p>

              <div className="space-y-4">
                {/* Change Type */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Change Type
                  </label>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
                    <button
                      onClick={() => setBulkEditData({ ...bulkEditData, changeType: 'amount' })}
                      className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                        bulkEditData.changeType === 'amount'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                      }`}
                    >
                      Fixed Amount ($)
                    </button>
                    <button
                      onClick={() => setBulkEditData({ ...bulkEditData, changeType: 'percentage' })}
                      className={`flex-1 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                        bulkEditData.changeType === 'percentage'
                          ? 'bg-white text-neutral-900 shadow-sm'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                      }`}
                    >
                      Percentage (%)
                    </button>
                  </div>
                </div>

                {/* Rate Change Input */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                    Rate {bulkEditData.changeType === 'amount' ? 'Adjustment' : 'Change'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-neutral-500">
                      {bulkEditData.changeType === 'amount' ? '$' : '%'}
                    </span>
                    <input
                      type="number"
                      value={bulkEditData.rateChange}
                      onChange={(e) => setBulkEditData({ ...bulkEditData, rateChange: e.target.value })}
                      placeholder={bulkEditData.changeType === 'amount' ? '50' : '10'}
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-neutral-200 text-[13px] font-medium text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-terra-500/40 focus:border-terra-400 transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5">
                    {bulkEditData.changeType === 'amount'
                      ? 'Enter amount to increase (+) or decrease (-) rates'
                      : 'Enter percentage to increase (+) or decrease (-) rates'}
                  </p>
                </div>

                {/* Selected Dates Preview */}
                <div className="p-3 rounded-lg bg-neutral-50">
                  <p className="text-[11px] font-medium text-neutral-600 mb-2">
                    Selected Dates:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDates.slice(0, 10).map(date => (
                      <span
                        key={date}
                        className="text-[11px] px-2 py-1 rounded bg-white text-neutral-700 border border-neutral-200"
                      >
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ))}
                    {selectedDates.length > 10 && (
                      <span className="text-[11px] px-2 py-1 text-neutral-500">
                        +{selectedDates.length - 10} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => setShowBulkEditModal(false)}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={applyBulkChanges}
                  fullWidth
                >
                  Apply to {selectedDates.length} Date{selectedDates.length !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default RateCalendar;
