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
import bookingsData from '../../data/dummy/reports/bookings.json';
import occupancyData from '../../data/dummy/reports/occupancy.json';

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
const generateExportCSV = (bookings: any[], occupancy: any[], roomTypes: any[]) => {
  const lines: string[] = [];

  lines.push('=== BOOKINGS & OCCUPANCY REPORT ===');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('--- Daily Bookings ---');
  lines.push('Date,Direct,OTA,Corporate,Walk-in,Total');
  bookings.forEach(d => {
    lines.push(`${d.date},${d.direct},${d.ota},${d.corporate},${d.walkin},${d.total}`);
  });
  lines.push('');

  lines.push('--- Daily Occupancy ---');
  lines.push('Date,Occupancy %,ADR,RevPAR,Revenue');
  occupancy.forEach(d => {
    lines.push(`${d.date},${d.occupancy},${d.adr},${d.revpar},${d.revenue}`);
  });
  lines.push('');

  lines.push('--- Room Type Performance ---');
  lines.push('Room Type,Bookings,Revenue,Occupancy %');
  roomTypes.forEach(r => {
    lines.push(`${r.name},${r.bookings},${r.revenue},${r.occupancy}`);
  });

  return lines.join('\n');
};

const SOURCE_COLORS = {
  Direct: '#4E5840',
  OTA: '#5C9BA4',
  Corporate: '#CDB261',
  'Walk-in': '#A57865'
};

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

export default function BookingsOccupancyReport() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Calculate stats
  const stats = useMemo(() => {
    const totalBookings = bookingsData.reduce((sum, d) => sum + (d.total || 0), 0);
    const totalRevenue = occupancyData.reduce((sum, d) => sum + (d.revenue || 0), 0);
    const avgOccupancy = Math.round(
      occupancyData.reduce((sum, d) => sum + (d.occupancy || 0), 0) / occupancyData.length
    );
    const avgADR = Math.round(
      occupancyData.reduce((sum, d) => sum + (d.adr || 0), 0) / occupancyData.length
    );
    const avgRevPAR = Math.round(
      occupancyData.reduce((sum, d) => sum + (d.revpar || 0), 0) / occupancyData.length
    );
    const directBookings = bookingsData.reduce((sum, d) => sum + (d.direct || 0), 0);
    const directPercent = totalBookings > 0 ? Math.round((directBookings / totalBookings) * 100) : 0;

    return { totalBookings, totalRevenue, avgOccupancy, avgADR, avgRevPAR, directPercent };
  }, []);

  // Booking source distribution
  const bookingSourceData = useMemo(() => {
    const totals = bookingsData.reduce(
      (acc, d) => ({
        direct: acc.direct + (d.direct || 0),
        ota: acc.ota + (d.ota || 0),
        corporate: acc.corporate + (d.corporate || 0),
        walkin: acc.walkin + (d.walkin || 0)
      }),
      { direct: 0, ota: 0, corporate: 0, walkin: 0 }
    );

    return [
      { name: 'Direct', value: totals.direct, color: SOURCE_COLORS.Direct },
      { name: 'OTA', value: totals.ota, color: SOURCE_COLORS.OTA },
      { name: 'Corporate', value: totals.corporate, color: SOURCE_COLORS.Corporate },
      { name: 'Walk-in', value: totals.walkin, color: SOURCE_COLORS['Walk-in'] }
    ];
  }, []);

  const totalSourceBookings = bookingSourceData.reduce((sum, s) => sum + s.value, 0);

  // Room type performance
  const roomTypeData = useMemo(() => {
    return [
      { name: 'Deluxe', bookings: 145, revenue: 1523000, occupancy: 82 },
      { name: 'Suite', bookings: 89, revenue: 1876000, occupancy: 78 },
      { name: 'Premium', bookings: 112, revenue: 1245000, occupancy: 85 },
      { name: 'Standard', bookings: 178, revenue: 890000, occupancy: 91 }
    ];
  }, []);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateExportCSV(bookingsData, occupancyData, roomTypeData);
    const filename = `bookings_occupancy_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, [roomTypeData]);

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
              <h1 className="text-xl font-semibold text-neutral-900">Bookings & Occupancy</h1>
              <p className="text-[13px] text-neutral-500">Booking trends and occupancy analytics</p>
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
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Total Bookings</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.totalBookings.toLocaleString()}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+8.2% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg Occupancy</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.avgOccupancy}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+5.1% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg ADR</p>
            <p className="text-2xl font-semibold text-neutral-900">₹{stats.avgADR.toLocaleString()}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+3.4% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg RevPAR</p>
            <p className="text-2xl font-semibold text-neutral-900">₹{stats.avgRevPAR.toLocaleString()}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+6.8% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-2xl font-semibold text-neutral-900">{formatCurrency(stats.totalRevenue)}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+12.3% vs last period</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Direct Bookings</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.directPercent}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">+2.1% vs last period</p>
          </div>
        </section>

        {/* Charts Row 1 - Line Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Occupancy Trend */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Occupancy Trend</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Daily occupancy rate over time</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                    width={40}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.date}</p>
                            <p>Occupancy: {payload[0].value}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#5C9BA4"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#5C9BA4' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ADR & RevPAR Trend */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">ADR & RevPAR Trend</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Average daily rate and revenue per available room</p>

            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occupancyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                  <Line type="monotone" dataKey="adr" stroke="#4E5840" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="revpar" stroke="#CDB261" strokeWidth={2} dot={false} />
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
          {/* Booking Sources Pie Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Booking Sources</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Distribution by channel</p>

            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingSourceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {bookingSourceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-3">
                {bookingSourceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] text-neutral-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-neutral-900">{item.value}</span>
                      <span className="text-[11px] text-neutral-400 w-10 text-right">
                        {totalSourceBookings > 0 ? ((item.value / totalSourceBookings) * 100).toFixed(0) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Bookings Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Daily Bookings</h3>
            <p className="text-[12px] text-neutral-500 mb-4">New bookings per day</p>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.date}</p>
                            <p>{payload[0].value} bookings</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" fill="#4E5840" radius={[3, 3, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Room Type Performance Table */}
        <section className="bg-white rounded-xl p-6">
          <h3 className="text-sm font-semibold text-neutral-900 mb-1">Room Type Performance</h3>
          <p className="text-[12px] text-neutral-500 mb-4">Bookings and revenue by room category</p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Room Type</th>
                  <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Bookings</th>
                  <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Revenue</th>
                  <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {roomTypeData.map((room, index) => (
                  <tr key={index} className="border-b border-neutral-50 last:border-0">
                    <td className="py-3 text-[13px] font-medium text-neutral-900">{room.name}</td>
                    <td className="py-3 text-[13px] text-neutral-600 text-right">{room.bookings}</td>
                    <td className="py-3 text-[13px] text-neutral-600 text-right">{formatCurrency(room.revenue)}</td>
                    <td className="py-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-sage-50 text-sage-700">
                        {room.occupancy}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
