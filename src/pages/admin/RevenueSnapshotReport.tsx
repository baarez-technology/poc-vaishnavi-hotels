import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import revenueData from '../../data/dummy/reports/revenue.json';

// Helper function to download CSV
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const formatCurrency = (value: number) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString()}`;
};

// Generate CSV content for export
const generateRevenueExportCSV = (
  dailyData: any[],
  bySource: any[],
  byRoomType: any[],
  weekly: any[]
) => {
  const lines: string[] = [];

  lines.push('=== REVENUE SNAPSHOT REPORT ===');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('--- Daily Revenue ---');
  lines.push('Date,Revenue,ADR,RevPAR,Occupancy %');
  dailyData.forEach(d => {
    lines.push(`${d.date},${d.revenue},${d.adr},${d.revpar},${d.occupancy}%`);
  });
  lines.push('');

  lines.push('--- Revenue by Source ---');
  lines.push('Source,Revenue');
  bySource.forEach(s => {
    lines.push(`${s.name},${s.value}`);
  });
  lines.push('');

  lines.push('--- Revenue by Room Type ---');
  lines.push('Room Type,Rooms Sold,Revenue,ADR');
  byRoomType.forEach(r => {
    lines.push(`${r.name},${r.rooms},${r.revenue},${r.adr}`);
  });
  lines.push('');

  lines.push('--- Weekly Summary ---');
  lines.push('Period,Revenue,Occupancy %,ADR');
  weekly.forEach(w => {
    lines.push(`${w.week},${w.revenue},${w.occupancy}%,${w.adr}`);
  });

  return lines.join('\n');
};

const SOURCE_COLORS = ['#4E5840', '#A57865', '#5C9BA4', '#CDB261', '#C8B29D'];

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

export default function RevenueSnapshotReport() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const totalRevenue = revenueData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgADR = Math.round(
      revenueData.reduce((sum, d) => sum + (d.adr || 0), 0) / revenueData.length
    );
    const avgRevPAR = Math.round(
      revenueData.reduce((sum, d) => sum + (d.revpar || 0), 0) / revenueData.length
    );
    const avgOccupancy = Math.round(
      revenueData.reduce((sum, d) => sum + (d.occupancy || 0), 0) / revenueData.length
    );
    const peakRevenue = Math.max(...revenueData.map((d) => d.revenue || 0));
    const targetRevenue = 18000000;
    const targetProgress = Math.round((totalRevenue / targetRevenue) * 100);

    return { totalRevenue, avgADR, avgRevPAR, avgOccupancy, peakRevenue, targetProgress };
  }, []);

  // Revenue by source
  const revenueBySource = useMemo(() => {
    return [
      { name: 'Room Revenue', value: 12450000, color: SOURCE_COLORS[0] },
      { name: 'F&B Revenue', value: 3280000, color: SOURCE_COLORS[1] },
      { name: 'Spa & Wellness', value: 1520000, color: SOURCE_COLORS[2] },
      { name: 'Events', value: 980000, color: SOURCE_COLORS[3] },
      { name: 'Other', value: 450000, color: SOURCE_COLORS[4] }
    ];
  }, []);

  const totalSourceRevenue = revenueBySource.reduce((sum, s) => sum + s.value, 0);

  // Revenue by room type
  const revenueByRoomType = useMemo(() => {
    return [
      { name: 'Presidential Suite', revenue: 3250000, rooms: 45, adr: 72200 },
      { name: 'Executive Suite', revenue: 2890000, rooms: 82, adr: 35200 },
      { name: 'Deluxe Room', revenue: 3150000, rooms: 156, adr: 20200 },
      { name: 'Premium Room', revenue: 2100000, rooms: 145, adr: 14500 },
      { name: 'Standard Room', revenue: 1060000, rooms: 112, adr: 9500 }
    ];
  }, []);

  // Daily revenue for bar chart
  const dailyRevenueData = useMemo(() => {
    return revenueData.slice(-14);
  }, []);

  // Weekly summary
  const weeklySummary = useMemo(() => {
    const weeks: { week: string; revenue: number; occupancy: number; adr: number }[] = [];
    for (let i = 0; i < revenueData.length; i += 7) {
      const weekData = revenueData.slice(i, i + 7);
      if (weekData.length > 0) {
        const weekRevenue = weekData.reduce((sum, d) => sum + (d.revenue || 0), 0);
        const weekAvgOcc = Math.round(
          weekData.reduce((sum, d) => sum + (d.occupancy || 0), 0) / weekData.length
        );
        const weekAvgADR = Math.round(
          weekData.reduce((sum, d) => sum + (d.adr || 0), 0) / weekData.length
        );
        weeks.push({
          week: `Week ${weeks.length + 1}`,
          revenue: weekRevenue,
          occupancy: weekAvgOcc,
          adr: weekAvgADR
        });
      }
    }
    return weeks;
  }, []);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateRevenueExportCSV(revenueData, revenueBySource, revenueByRoomType, weeklySummary);
    const filename = `revenue_snapshot_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, [revenueBySource, revenueByRoomType, weeklySummary]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F7F7' }}>
      <div className="px-10 py-8 space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/reports')}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-600" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-neutral-900">Revenue Snapshot</h1>
              <p className="text-[13px] text-neutral-500">Comprehensive revenue analysis and forecasting</p>
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
              onClick={() => window.location.reload()}
              className="w-9 h-9 rounded-lg flex items-center justify-center bg-white border border-neutral-200"
            >
              <RefreshCw className="w-4 h-4 text-neutral-500" />
            </button>
            <button
              onClick={handleExport}
              className="h-9 px-4 rounded-lg bg-terra-500 text-white text-[13px] font-medium flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+15.2% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg ADR</p>
            <p className="text-2xl font-semibold text-neutral-900">₹{stats.avgADR.toLocaleString()}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+4.8% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg RevPAR</p>
            <p className="text-2xl font-semibold text-neutral-900">₹{stats.avgRevPAR.toLocaleString()}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+8.3% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg Occupancy</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.avgOccupancy}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+5.6% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Peak Day Revenue</p>
            <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(stats.peakRevenue)}</p>
            <p className="text-[11px] text-neutral-500 font-medium mt-1">Best performing day</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Target Progress</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.targetProgress}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">On track</p>
          </div>
        </section>

        {/* Charts Row 1 - Line Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Revenue Trend</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Daily revenue over time</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={45}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.date}</p>
                            <p>Revenue: {formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4E5840"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#4E5840' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ADR vs RevPAR */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">ADR vs RevPAR</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Rate performance metrics</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={45}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium mb-1">{payload[0].payload.date}</p>
                            <p>ADR: ₹{payload[0].payload.adr?.toLocaleString()}</p>
                            <p>RevPAR: ₹{payload[0].payload.revpar?.toLocaleString()}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line type="monotone" dataKey="adr" stroke="#A57865" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="revpar" stroke="#5C9BA4" strokeWidth={2} dot={false} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => <span className="text-[12px] text-neutral-600">{value === 'adr' ? 'ADR' : 'RevPAR'}</span>}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Charts Row 2 */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Revenue by Source Pie Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Revenue by Source</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Revenue distribution</p>

            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueBySource}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {revenueBySource.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-2.5">
                {revenueBySource.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[12px] text-neutral-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-neutral-900">{formatCurrency(item.value)}</span>
                      <span className="text-[10px] text-neutral-400 w-8 text-right">
                        {((item.value / totalSourceRevenue) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Revenue Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Daily Revenue (Last 14 Days)</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Revenue performance</p>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getDate()}/${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    width={45}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.date}</p>
                            <p>{formatCurrency(payload[0].value as number)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="revenue" fill="#4E5840" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Tables Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Room Type */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Revenue by Room Type</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Performance by category</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Room Type</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Rooms</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Revenue</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">ADR</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByRoomType.map((room, index) => (
                    <tr key={index} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3 text-[13px] font-medium text-neutral-900">{room.name}</td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">{room.rooms}</td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">{formatCurrency(room.revenue)}</td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">₹{room.adr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Weekly Summary</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Week-over-week performance</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Period</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Revenue</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Occupancy</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">ADR</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklySummary.map((week, index) => (
                    <tr key={index} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3 text-[13px] font-medium text-neutral-900">{week.week}</td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">{formatCurrency(week.revenue)}</td>
                      <td className="py-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-sage-50 text-sage-700">
                          {week.occupancy}%
                        </span>
                      </td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">₹{week.adr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
