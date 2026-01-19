import { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import PickupChart, { PickupSummaryCard } from '../../../components/revenue-management/PickupChart';
import { Button } from '../../../components/ui2/Button';
// Table components replaced with native table for better responsive control
import { StatusBadge } from '../../../components/ui2/Badge';
import { TableSearchBar } from '../../../components/ui2/DataTableView';

const PickupAnalysis = () => {
  const { pickup, pickupMetrics, updatePickup, compareToHistorical, predictPickup } = useRMS();

  const [dateRange, setDateRange] = useState(14);
  const [chartType, setChartType] = useState('area');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      updatePickup();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Get pickup alerts
  const allAlerts = Object.values(pickup)
    .flatMap(p => p.alerts || [])
    .filter(a => a.severity === 'critical' || a.severity === 'high')
    .slice(0, 5);

  // Get dates for the table with search filtering
  const tableDates = useMemo(() => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < dateRange; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      if (pickup[dateStr]) {
        dates.push({ date: dateStr, data: pickup[dateStr] });
      }
    }

    if (!searchQuery.trim()) return dates;

    const query = searchQuery.toLowerCase();
    return dates.filter(({ date, data }) => {
      const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
      return (
        formattedDate.toLowerCase().includes(query) ||
        data.paceStatus?.toLowerCase().includes(query) ||
        data.currentBookings?.toString().includes(query) ||
        data.expectedTotal?.toString().includes(query)
      );
    });
  }, [pickup, dateRange, searchQuery]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <main className="px-4 sm:px-6 lg:px-10 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
            Pickup Analysis
          </h1>
          <p className="text-xs sm:text-[13px] text-neutral-500 mt-1">
            Monitor booking pace and compare to historical trends
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
                {days}d
              </button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={RefreshCw}
            variant="primary"
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <PickupSummaryCard period="next7Days" />
        <PickupSummaryCard period="next14Days" />
        <PickupSummaryCard period="next30Days" />
      </section>

      {/* Alerts Banner */}
      {allAlerts.length > 0 && (
        <div className="rounded-[10px] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gold-50">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center bg-gold-100 flex-shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gold-600" />
            </div>
            <div>
              <p className="text-xs sm:text-[13px] font-semibold text-gold-800">
                {allAlerts.length} Pickup Alert{allAlerts.length !== 1 ? 's' : ''} Detected
              </p>
              <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                {allAlerts.filter(a => a.severity === 'critical').length > 0 &&
                  `${allAlerts.filter(a => a.severity === 'critical').length} critical`}
                {allAlerts.filter(a => a.severity === 'critical').length > 0 &&
                 allAlerts.filter(a => a.severity === 'high').length > 0 && ', '}
                {allAlerts.filter(a => a.severity === 'high').length > 0 &&
                  `${allAlerts.filter(a => a.severity === 'high').length} high priority`}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto">
            View Details
          </Button>
        </div>
      )}

      {/* Chart Section */}
      <section className="rounded-[10px] bg-white overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[13px] sm:text-sm font-semibold text-neutral-800">Booking Pace Chart</h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">
              Visual trends of current vs expected bookings
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
            <button
              onClick={() => setChartType('area')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                chartType === 'area'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 sm:px-4 py-1.5 text-xs sm:text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                chartType === 'bar'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        <div className="px-2 sm:px-6 pb-4 sm:pb-6">
          <PickupChart dateRange={dateRange} chartType={chartType} />
        </div>
      </section>

      {/* Detailed Table */}
      <section className="rounded-[10px] bg-white overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-[13px] sm:text-sm font-semibold text-neutral-800">Detailed Pickup Data</h3>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 font-medium mt-0.5">
              Day-by-day breakdown with pace indicators and historical comparisons
            </p>
          </div>
          <TableSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by date, pace status..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="bg-neutral-50/30 border-b border-neutral-100">
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Date
                </th>
                <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Current
                </th>
                <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Expected
                </th>
                <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Progress
                </th>
                <th className="text-center px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Pace
                </th>
                <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  vs Last Year
                </th>
                <th className="text-right px-3 sm:px-6 py-3 sm:py-4 text-[9px] sm:text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                  Remaining
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tableDates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-terra-50 flex items-center justify-center mb-3 sm:mb-4">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-terra-500" />
                      </div>
                      <p className="text-xs sm:text-[13px] font-semibold text-neutral-800 mb-1">
                        No dates found
                      </p>
                      <p className="text-[10px] sm:text-[11px] text-neutral-500 font-medium">
                        {searchQuery ? "No pickup data matches your search" : "No pickup data available for this period"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                tableDates.map(({ date, data }) => (
                  <tr key={date} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <p className="text-xs sm:text-[13px] font-medium text-neutral-900 whitespace-nowrap">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-neutral-400 whitespace-nowrap">
                          {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })} • {data.daysOut}d out
                        </p>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <span className="text-sm sm:text-[15px] font-semibold text-neutral-900 tabular-nums">
                        {data.currentBookings}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <span className="text-xs sm:text-[13px] text-neutral-600 tabular-nums">
                        {data.expectedTotal}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 sm:w-20 h-1.5 rounded-full overflow-hidden bg-neutral-200">
                          <div
                            className="h-full rounded-full bg-terra-500"
                            style={{ width: `${data.bookingProgress}%` }}
                          />
                        </div>
                        <span className="text-xs sm:text-[13px] font-medium text-neutral-700 tabular-nums min-w-[36px] text-right">
                          {data.bookingProgress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                      <StatusBadge status={data.paceStatus} />
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <span className={`font-semibold text-xs sm:text-[13px] tabular-nums ${
                        data.comparisons.lastYear.variance > 0
                          ? 'text-sage-600'
                          : data.comparisons.lastYear.variance < 0
                            ? 'text-rose-600'
                            : 'text-neutral-500'
                      }`}>
                        {data.comparisons.lastYear.variance > 0 ? '+' : ''}{data.comparisons.lastYear.variance}%
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                      <span className="text-sm sm:text-[15px] font-semibold text-neutral-900 tabular-nums">
                        {data.remainingToSell}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
      </main>
    </div>
  );
};

export default PickupAnalysis;
