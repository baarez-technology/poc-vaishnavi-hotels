import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

const formatCurrency = (value) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString()}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-neutral-200 rounded-[10px] p-3 shadow-lg">
        <p className="text-[11px] text-neutral-500 font-medium mb-1">{label}</p>
        <p className="text-sm font-bold text-terra-600">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[0].payload.demand && (
          <p className="text-[11px] text-neutral-400 mt-1">
            Demand: {Math.round(payload[0].payload.demand * 100)}%
          </p>
        )}
      </div>
    );
  }
  return null;
};

export default function ForecastChart({ data }) {
  const chartData = useMemo(() => {
    return data.map((item) => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }));
  }, [data]);

  const todayIndex = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return data.findIndex(item => item.date === today);
  }, [data]);

  const totalForecast = useMemo(() => {
    return data.slice(0, 7).reduce((sum, item) => sum + item.revenue, 0);
  }, [data]);

  const avgRevenue = useMemo(() => {
    return Math.round(data.reduce((sum, item) => sum + item.revenue, 0) / data.length);
  }, [data]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Revenue Forecast</h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Next 14 days projection</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-neutral-400 font-medium">7-Day Forecast</p>
          <p className="text-xl font-bold text-terra-600">{formatCurrency(totalForecast)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenueForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A57865" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#A57865" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={{ stroke: '#E5E4E0' }}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />

            {/* Average Reference Line */}
            <ReferenceLine
              y={avgRevenue}
              stroke="#CDB261"
              strokeDasharray="5 5"
              label={{
                value: 'Avg',
                position: 'right',
                fill: '#CDB261',
                fontSize: 10
              }}
            />

            {/* Today Marker */}
            {todayIndex >= 0 && (
              <ReferenceLine
                x={chartData[todayIndex]?.date}
                stroke="#4E5840"
                strokeWidth={2}
                label={{
                  value: 'Today',
                  position: 'top',
                  fill: '#4E5840',
                  fontSize: 10
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#A57865"
              strokeWidth={2.5}
              fill="url(#colorRevenueForecast)"
              dot={false}
              activeDot={{ r: 5, fill: '#A57865', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-terra-500" />
          <span className="text-[11px] text-neutral-600 font-medium">Forecasted Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed border-gold-500" />
          <span className="text-[11px] text-neutral-600 font-medium">Average ({formatCurrency(avgRevenue)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-sage-500" />
          <span className="text-[11px] text-neutral-600 font-medium">Today</span>
        </div>
      </div>
    </div>
  );
}
