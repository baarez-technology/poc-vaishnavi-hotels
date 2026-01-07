import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const formatCurrency = (value) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border border-neutral-200 rounded-[10px] p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <p className="text-[13px] font-semibold text-neutral-900">{data.segment}</p>
        </div>
        <p className="text-lg font-bold mb-2" style={{ color: data.color }}>
          {formatCurrency(data.value)}
        </p>
        <div className="space-y-1 text-[11px] text-neutral-500">
          <p>{data.bookings} bookings</p>
          <p>Avg Rate: ₹{data.avgRate.toLocaleString()}</p>
        </div>
      </div>
    );
  }
  return null;
};

export default function RevenueBySegment({ data }) {
  const totalRevenue = useMemo(() => {
    return data.reduce((sum, segment) => sum + segment.value, 0);
  }, [data]);

  const totalBookings = useMemo(() => {
    return data.reduce((sum, segment) => sum + segment.bookings, 0);
  }, [data]);

  const sortedByValue = useMemo(() => {
    return [...data].sort((a, b) => b.value - a.value);
  }, [data]);

  const sortedByBookings = useMemo(() => {
    return [...data].sort((a, b) => b.bookings - a.bookings);
  }, [data]);

  const highestAvgRate = useMemo(() => {
    return Math.max(...data.map(d => d.avgRate));
  }, [data]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-800">Revenue by Segment</h3>
        <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{totalBookings.toLocaleString()} total bookings</p>
      </div>

      <div className="flex items-start gap-6">
        {/* Chart */}
        <div className="relative w-[160px] h-[160px] flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
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
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">Total</p>
            <p className="text-lg font-bold text-neutral-900">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-1.5 pt-1">
          {data.map((segment, index) => {
            const percentage = Math.round((segment.value / totalRevenue) * 100);
            return (
              <div
                key={index}
                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-neutral-50 transition-colors -mx-2"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-[13px] font-medium text-neutral-700">{segment.segment}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold text-neutral-900">
                    {formatCurrency(segment.value)}
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded min-w-[32px] text-center">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-neutral-100">
        <div className="p-3 rounded-lg bg-neutral-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-terra-100 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-terra-600" />
            </div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Top Segment</p>
          </div>
          <p className="text-[13px] font-bold" style={{ color: sortedByValue[0]?.color }}>
            {sortedByValue[0]?.segment}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-ocean-100 flex items-center justify-center">
              <DollarSign className="w-3 h-3 text-ocean-600" />
            </div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Peak Rate</p>
          </div>
          <p className="text-[13px] font-bold text-neutral-900">
            ₹{highestAvgRate.toLocaleString()}
          </p>
        </div>

        <div className="p-3 rounded-lg bg-neutral-50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-gold-100 flex items-center justify-center">
              <Users className="w-3 h-3 text-gold-600" />
            </div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Most Bookings</p>
          </div>
          <p className="text-[13px] font-bold text-neutral-900">
            {sortedByBookings[0]?.segment}
          </p>
        </div>
      </div>
    </div>
  );
}
