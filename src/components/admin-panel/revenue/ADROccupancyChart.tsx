import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-lg">
        <p className="text-xs text-neutral-500 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'ADR' ? `₹${entry.value.toLocaleString()}` : `${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ADROccupancyChart({ data }) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [data]);

  const avgADR = useMemo(() => {
    return Math.round(data.reduce((sum, item) => sum + item.adr, 0) / data.length);
  }, [data]);

  const avgOccupancy = useMemo(() => {
    return Math.round(data.reduce((sum, item) => sum + item.occupancy, 0) / data.length);
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-[#5C9BA4]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">ADR & Occupancy</h3>
            <p className="text-sm text-neutral-500">Rate vs occupancy performance</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-neutral-500">Avg ADR</p>
            <p className="text-lg font-bold text-[#5C9BA4]">₹{avgADR.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Avg Occupancy</p>
            <p className="text-lg font-bold text-[#A57865]">{avgOccupancy}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E5E5' }}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              domain={['dataMin - 1000', 'dataMax + 1000']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-xs text-neutral-600">{value}</span>
              )}
            />

            <Bar
              yAxisId="left"
              dataKey="adr"
              name="ADR"
              fill="#5C9BA4"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancy"
              name="Occupancy"
              stroke="#A57865"
              strokeWidth={3}
              dot={{ fill: '#A57865', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#A57865', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-100">
        <div className="text-center">
          <p className="text-xs text-neutral-500">Highest ADR</p>
          <p className="text-sm font-bold text-[#5C9BA4]">
            ₹{Math.max(...data.map(d => d.adr)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Lowest ADR</p>
          <p className="text-sm font-bold text-neutral-600">
            ₹{Math.min(...data.map(d => d.adr)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Peak Occupancy</p>
          <p className="text-sm font-bold text-[#A57865]">
            {Math.max(...data.map(d => d.occupancy))}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Lowest Occupancy</p>
          <p className="text-sm font-bold text-neutral-600">
            {Math.min(...data.map(d => d.occupancy))}%
          </p>
        </div>
      </div>
    </div>
  );
}
