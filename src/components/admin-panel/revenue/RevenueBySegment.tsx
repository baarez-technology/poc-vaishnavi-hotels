import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { PieChartIcon } from 'lucide-react';

// Default fallback color
const DEFAULT_COLOR = '#6B7280';
const SEGMENT_COLORS = ['#A57865', '#5C9BA4', '#4E5840', '#CDB261', '#8E6554'];

const formatCurrency = (value) => {
  if (!value || isNaN(value)) return '₹0';
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-lg">
        <p className="text-sm font-semibold text-neutral-900">{data.segment}</p>
        <p className="text-sm font-bold" style={{ color: data.color }}>
          {formatCurrency(data.value)}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          {data.bookings} bookings • Avg ₹{data.avgRate.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function RevenueBySegment({ data: rawData }) {
  // Ensure data has colors and default values
  const data = (rawData || []).map((segment, index) => ({
    ...segment,
    color: segment.color || SEGMENT_COLORS[index % SEGMENT_COLORS.length] || DEFAULT_COLOR,
    value: segment.value || 0,
    bookings: segment.bookings || 0,
    avgRate: segment.avgRate || 0,
  }));

  const totalRevenue = useMemo(() => {
    return data.reduce((sum, segment) => sum + (segment.value || 0), 0);
  }, [data]);

  const totalBookings = useMemo(() => {
    return data.reduce((sum, segment) => sum + (segment.bookings || 0), 0);
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-[#4E5840]/10 flex items-center justify-center">
          <PieChartIcon className="w-5 h-5 text-[#4E5840]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">Revenue by Segment</h3>
          <p className="text-sm text-neutral-500">{totalBookings} total bookings</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Chart */}
        <div className="relative w-[200px] h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">
          {data.map((segment, index) => {
            const percentage = Math.round((segment.value / totalRevenue) * 100);
            return (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-sm text-neutral-700">{segment.segment}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatCurrency(segment.value)}
                  </span>
                  <span className="text-xs text-neutral-500 w-10 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-neutral-100">
        <div className="text-center">
          <p className="text-xs text-neutral-500">Top Segment</p>
          <p className="text-sm font-bold" style={{ color: data[0]?.color }}>
            {data.sort((a, b) => b.value - a.value)[0]?.segment}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Highest Avg Rate</p>
          <p className="text-sm font-bold text-neutral-900">
            ₹{Math.max(...data.map(d => d.avgRate)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Most Bookings</p>
          <p className="text-sm font-bold text-neutral-900">
            {data.sort((a, b) => b.bookings - a.bookings)[0]?.segment}
          </p>
        </div>
      </div>
    </div>
  );
}
