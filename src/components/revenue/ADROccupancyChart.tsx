import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-[10px] p-3 shadow-lg">
        <p className="text-[11px] text-neutral-500 font-medium mb-2">{label}</p>
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
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">ADR & Occupancy</h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Rate vs occupancy performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-neutral-400 font-medium">Avg ADR</p>
            <p className="text-lg font-bold text-ocean-600">₹{avgADR.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-400 font-medium">Avg Occupancy</p>
            <p className="text-lg font-bold text-terra-600">{avgOccupancy}%</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#E5E4E0' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              yAxisId="left"
              orientation="left"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              domain={['dataMin - 1000', 'dataMax + 1000']}
              dx={-5}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              domain={[0, 100]}
              dx={5}
            />
            <Tooltip content={<CustomTooltip />} />

            <Bar
              yAxisId="left"
              dataKey="adr"
              name="ADR"
              fill="#5C9BA4"
              radius={[4, 4, 0, 0]}
              barSize={18}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="occupancy"
              name="Occupancy"
              stroke="#A57865"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#A57865', stroke: '#fff', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100">
        <div className="p-3 rounded-lg bg-neutral-50 text-center">
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Peak ADR</p>
          <p className="text-[15px] font-bold text-ocean-600 mt-1">
            ₹{Math.max(...data.map(d => d.adr)).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-neutral-50 text-center">
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Low ADR</p>
          <p className="text-[15px] font-bold text-neutral-600 mt-1">
            ₹{Math.min(...data.map(d => d.adr)).toLocaleString()}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-neutral-50 text-center">
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Peak Occ</p>
          <p className="text-[15px] font-bold text-terra-600 mt-1">
            {Math.max(...data.map(d => d.occupancy))}%
          </p>
        </div>
        <div className="p-3 rounded-lg bg-neutral-50 text-center">
          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Low Occ</p>
          <p className="text-[15px] font-bold text-neutral-600 mt-1">
            {Math.min(...data.map(d => d.occupancy))}%
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-ocean-500" />
          <span className="text-[11px] text-neutral-600 font-medium">ADR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-terra-500" style={{ borderStyle: 'solid', borderWidth: '1.5px', borderColor: '#A57865' }} />
          <span className="text-[11px] text-neutral-600 font-medium">Occupancy</span>
        </div>
      </div>
    </div>
  );
}
