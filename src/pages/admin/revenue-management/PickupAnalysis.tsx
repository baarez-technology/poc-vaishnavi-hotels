import { useState, useMemo } from 'react';
import { AlertCircle, RefreshCw, Calendar } from 'lucide-react';
import { useRMS } from '../../../context/RMSContext';
import PickupChart, { PickupSummaryCard } from '../../../components/revenue-management/PickupChart';
import { Button } from '../../../components/ui2/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty } from '../../../components/ui2/Table';
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
      <main className="px-10 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Pickup Analysis
          </h1>
          <p className="text-[13px] text-neutral-500 mt-1">
            Monitor booking pace and compare to historical trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
            {[7, 14, 30].map((days) => (
              <button
                key={days}
                onClick={() => setDateRange(days)}
                className={`px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                  dateRange === days
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
          <Button
            onClick={handleRefresh}
            loading={isRefreshing}
            icon={RefreshCw}
            variant="primary"
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PickupSummaryCard period="next7Days" />
        <PickupSummaryCard period="next14Days" />
        <PickupSummaryCard period="next30Days" />
      </section>

      {/* Alerts Banner */}
      {allAlerts.length > 0 && (
        <div className="rounded-[10px] p-4 flex items-center justify-between bg-gold-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gold-100">
              <AlertCircle className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gold-800">
                {allAlerts.length} Pickup Alert{allAlerts.length !== 1 ? 's' : ''} Detected
              </p>
              <p className="text-[11px] text-neutral-500 font-medium">
                {allAlerts.filter(a => a.severity === 'critical').length > 0 &&
                  `${allAlerts.filter(a => a.severity === 'critical').length} critical`}
                {allAlerts.filter(a => a.severity === 'critical').length > 0 &&
                 allAlerts.filter(a => a.severity === 'high').length > 0 && ', '}
                {allAlerts.filter(a => a.severity === 'high').length > 0 &&
                  `${allAlerts.filter(a => a.severity === 'high').length} high priority`}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            View Details
          </Button>
        </div>
      )}

      {/* Chart Section */}
      <section className="rounded-[10px] bg-white overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Booking Pace Chart</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Visual trends of current vs expected bookings
            </p>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-lg bg-neutral-100">
            <button
              onClick={() => setChartType('area')}
              className={`px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                chartType === 'area'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Area
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-200 ${
                chartType === 'bar'
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-white/50'
              }`}
            >
              Bar
            </button>
          </div>
        </div>
        <div className="px-6 pb-6">
          <PickupChart dateRange={dateRange} chartType={chartType} />
        </div>
      </section>

      {/* Detailed Table */}
      <section className="rounded-[10px] bg-white overflow-hidden">
        <div className="px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Detailed Pickup Data</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">
              Day-by-day breakdown with pace indicators and historical comparisons
            </p>
          </div>
          <TableSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by date, pace status..."
          />
        </div>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Date</TableHead>
              <TableHead align="right">Current</TableHead>
              <TableHead align="right">Expected</TableHead>
              <TableHead align="right">Progress</TableHead>
              <TableHead align="center">Pace</TableHead>
              <TableHead align="right">vs Last Year</TableHead>
              <TableHead align="right">Remaining</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {tableDates.length === 0 ? (
              <TableEmpty
                icon={Calendar}
                title="No dates found"
                description={searchQuery ? "No pickup data matches your search" : "No pickup data available for this period"}
              />
            ) : (
              tableDates.map(({ date, data }) => (
                <TableRow key={date}>
                  <TableCell>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })} • {data.daysOut}d out
                      </p>
                    </div>
                  </TableCell>
                  <TableCell align="right" className="text-[15px] font-semibold text-neutral-900">
                    {data.currentBookings}
                  </TableCell>
                  <TableCell align="right" className="text-[13px] text-neutral-600">
                    {data.expectedTotal}
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-terra-500"
                          style={{ width: `${data.bookingProgress}%` }}
                        />
                      </div>
                      <span className="text-[13px] font-medium min-w-[2.5rem] text-neutral-700">
                        {data.bookingProgress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge status={data.paceStatus} />
                  </TableCell>
                  <TableCell align="right">
                    <span className={`font-semibold text-[13px] ${
                      data.comparisons.lastYear.variance > 0
                        ? 'text-sage-600'
                        : data.comparisons.lastYear.variance < 0
                          ? 'text-rose-600'
                          : 'text-neutral-500'
                    }`}>
                      {data.comparisons.lastYear.variance > 0 ? '+' : ''}{data.comparisons.lastYear.variance}%
                    </span>
                  </TableCell>
                  <TableCell align="right" className="text-[15px] font-semibold text-neutral-900">
                    {data.remainingToSell}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
      </main>
    </div>
  );
};

export default PickupAnalysis;
