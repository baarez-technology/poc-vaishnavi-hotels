import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

export default function ForecastChart({ data }) {
  const { symbol, formatCurrency } = useCurrency();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-lg">
          <p className="text-xs text-neutral-500 mb-1">{label}</p>
          <p className="text-sm font-bold text-[#A57865]">
            {formatCurrency(payload[0].value)}
          </p>
          {payload[0].payload.demand && (
            <p className="text-xs text-neutral-400 mt-1">
              Demand: {Math.round(payload[0].payload.demand * 100)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };
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
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A57865]/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-[#A57865]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Revenue Forecast</h3>
            <p className="text-sm text-neutral-500">Next 14 days projection</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-neutral-500">7-Day Forecast</p>
          <p className="text-xl font-bold text-[#A57865]">{formatCurrency(totalForecast)}</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={{ stroke: '#E5E5E5' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${symbol}${(value / 1000).toFixed(0)}K`}
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

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#A57865"
              strokeWidth={3}
              dot={{ fill: '#A57865', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#A57865', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#A57865]" />
          <span className="text-xs text-neutral-600">Forecasted Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-0 border-t-2 border-dashed border-[#CDB261]" />
          <span className="text-xs text-neutral-600">Average ({formatCurrency(avgRevenue)})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4E5840]" />
          <span className="text-xs text-neutral-600">Today</span>
        </div>
      </div>
    </div>
  );
}
