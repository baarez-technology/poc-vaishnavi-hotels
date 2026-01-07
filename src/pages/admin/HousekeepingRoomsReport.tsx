import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import housekeepingData from '../../data/dummy/reports/housekeeping.json';

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

// Generate CSV content for export
const generateHousekeepingExportCSV = (rooms: any[], turnoverByFloor: any[], statusDist: any[], issues: any[]) => {
  const lines: string[] = [];

  lines.push('=== HOUSEKEEPING & ROOMS REPORT ===');
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push('');

  lines.push('--- Room Status Details ---');
  lines.push('Room,Type,Status,Last Cleaned,Turnover (min),Inspection %');
  rooms.forEach(r => {
    lines.push(`${r.room},${r.type},${r.status},${r.lastCleaned},${r.turnoverTime},${r.inspectionScore}%`);
  });
  lines.push('');

  lines.push('--- Turnover by Floor ---');
  lines.push('Floor,Avg Turnover (min),Rooms');
  turnoverByFloor.forEach(f => {
    lines.push(`${f.name},${f.avgTurnover},${f.rooms}`);
  });
  lines.push('');

  lines.push('--- Status Distribution ---');
  lines.push('Status,Count');
  statusDist.forEach(s => {
    lines.push(`${s.name},${s.value}`);
  });
  lines.push('');

  if (issues.length > 0) {
    lines.push('--- Active Issues ---');
    lines.push('Room,Type,Issues,Priority');
    issues.forEach(i => {
      lines.push(`${i.room},${i.type},"${i.issues}",${i.priority}`);
    });
  }

  return lines.join('\n');
};

const STATUS_COLORS = {
  clean: '#4E5840',
  dirty: '#CDB261',
  inspecting: '#5C9BA4',
  maintenance: '#A57865'
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

export default function HousekeepingRoomsReport() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  // Calculate KPIs
  const stats = useMemo(() => {
    const clean = housekeepingData.filter((r) => r.status === 'clean').length;
    const dirty = housekeepingData.filter((r) => r.status === 'dirty').length;
    const inspecting = housekeepingData.filter((r) => r.status === 'inspecting').length;
    const maintenance = housekeepingData.filter((r) => r.status === 'maintenance').length;
    const avgTurnover = Math.round(
      housekeepingData.reduce((sum, r) => sum + r.turnoverTime, 0) / housekeepingData.length
    );
    const avgInspection = Math.round(
      housekeepingData.reduce((sum, r) => sum + r.inspectionScore, 0) / housekeepingData.length
    );

    return { clean, dirty, inspecting, maintenance, avgTurnover, avgInspection };
  }, []);

  // Room status distribution for pie chart
  const statusDistribution = useMemo(() => {
    return [
      { name: 'Clean', value: stats.clean, color: STATUS_COLORS.clean },
      { name: 'Dirty', value: stats.dirty, color: STATUS_COLORS.dirty },
      { name: 'Inspecting', value: stats.inspecting, color: STATUS_COLORS.inspecting },
      { name: 'Maintenance', value: stats.maintenance, color: STATUS_COLORS.maintenance }
    ];
  }, [stats]);

  const totalRooms = statusDistribution.reduce((sum, s) => sum + s.value, 0);

  // Turnover by floor
  const turnoverByFloor = useMemo(() => {
    const floors: Record<string, { times: number[]; count: number }> = {};
    housekeepingData.forEach((r) => {
      const floor = r.room.charAt(0);
      if (!floors[floor]) {
        floors[floor] = { times: [], count: 0 };
      }
      floors[floor].times.push(r.turnoverTime);
      floors[floor].count++;
    });

    return Object.entries(floors).map(([floor, data]) => ({
      name: `Floor ${floor}`,
      avgTurnover: Math.round(data.times.reduce((a, b) => a + b, 0) / data.count),
      rooms: data.count
    }));
  }, []);

  // Issues data
  const issuesData = useMemo(() => {
    return housekeepingData
      .filter((r) => r.issues && r.issues.length > 0)
      .map((r) => ({
        room: r.room,
        type: r.type,
        issues: r.issues.join(', '),
        priority: r.status === 'maintenance' ? 'High' : 'Medium'
      }));
  }, []);

  // Export handler
  const handleExport = useCallback(() => {
    const csvContent = generateHousekeepingExportCSV(housekeepingData, turnoverByFloor, statusDistribution, issuesData);
    const filename = `housekeeping_rooms_report_${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csvContent, filename);
  }, [turnoverByFloor, statusDistribution, issuesData]);

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
              <h1 className="text-xl font-semibold text-neutral-900">Housekeeping & Rooms</h1>
              <p className="text-[13px] text-neutral-500">Room status and efficiency metrics</p>
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
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Clean</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.clean}</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">Ready for guests</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Dirty</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.dirty}</p>
            <p className="text-[11px] text-gold-600 font-medium mt-1">Needs cleaning</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Inspecting</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.inspecting}</p>
            <p className="text-[11px] text-ocean-600 font-medium mt-1">Being checked</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Maintenance</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.maintenance}</p>
            <p className="text-[11px] text-terra-600 font-medium mt-1">Under repair</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Avg Turnover</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.avgTurnover}<span className="text-sm text-neutral-400 ml-1">min</span></p>
            <p className="text-[11px] text-neutral-500 font-medium mt-1">Per room</p>
          </div>
          <div className="bg-white rounded-xl p-5">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Inspection Score</p>
            <p className="text-2xl font-semibold text-neutral-900">{stats.avgInspection}%</p>
            <p className="text-[11px] text-sage-600 font-medium mt-1">Average</p>
          </div>
        </section>

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Room Status Pie Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Room Status Distribution</h3>
            <p className="text-[12px] text-neutral-500 mb-4">{totalRooms} total rooms</p>

            <div className="flex items-center gap-6">
              <div className="w-40 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex-1 space-y-3">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] text-neutral-600">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-medium text-neutral-900">{item.value}</span>
                      <span className="text-[11px] text-neutral-400 w-10 text-right">
                        {((item.value / totalRooms) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Turnover Bar Chart */}
          <div className="lg:col-span-3 bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Turnover Time by Floor</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Average minutes per room</p>

            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={turnoverByFloor} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#737373' }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#737373' }}
                    width={30}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-neutral-900 text-white text-[12px] px-3 py-2 rounded-lg">
                            <p className="font-medium">{payload[0].payload.name}</p>
                            <p>{payload[0].value} min avg</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="avgTurnover" fill="#5C9BA4" radius={[4, 4, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Tables Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Status Table */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Room Details</h3>
            <p className="text-[12px] text-neutral-500 mb-4">Current status of all rooms</p>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Room</th>
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Type</th>
                    <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Status</th>
                    <th className="text-right text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Turnover</th>
                  </tr>
                </thead>
                <tbody>
                  {housekeepingData.slice(0, 8).map((room, index) => (
                    <tr key={index} className="border-b border-neutral-50 last:border-0">
                      <td className="py-3 text-[13px] font-medium text-neutral-900">{room.room}</td>
                      <td className="py-3 text-[13px] text-neutral-600">{room.type}</td>
                      <td className="py-3">
                        <span
                          className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                          style={{ color: STATUS_COLORS[room.status] }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: STATUS_COLORS[room.status] }}
                          />
                          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 text-[13px] text-neutral-600 text-right">{room.turnoverTime} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Issues Table */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Active Issues</h3>
            <p className="text-[12px] text-neutral-500 mb-4">{issuesData.length} rooms need attention</p>

            {issuesData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Room</th>
                      <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Issue</th>
                      <th className="text-left text-[11px] font-medium text-neutral-400 uppercase tracking-wider pb-3">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issuesData.slice(0, 8).map((issue, index) => (
                      <tr key={index} className="border-b border-neutral-50 last:border-0">
                        <td className="py-3 text-[13px] font-medium text-neutral-900">{issue.room}</td>
                        <td className="py-3 text-[13px] text-neutral-600 max-w-[200px] truncate">{issue.issues}</td>
                        <td className="py-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                              issue.priority === 'High'
                                ? 'bg-terra-50 text-terra-700'
                                : 'bg-gold-50 text-gold-700'
                            }`}
                          >
                            {issue.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-[13px] text-neutral-500">No active issues</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
