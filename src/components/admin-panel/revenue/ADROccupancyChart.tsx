import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { BarChart3, RefreshCw, Loader2 } from 'lucide-react';
import { revenueIntelligenceService } from '../../../api/services/revenue-intelligence.service';

interface ChartDataItem {
  date: string;
  adr: number;
  occupancy: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#E5E5E5] rounded-xl p-3 shadow-lg">
        <p className="text-xs text-neutral-500 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: {entry.name === 'ADR' ? `$${entry.value.toLocaleString()}` : `${entry.value}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function ADROccupancyChart() {
  const [data, setData] = useState<ChartDataItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [forecast, kpiSummary] = await Promise.all([
        revenueIntelligenceService.getForecast(),
        revenueIntelligenceService.getKPISummary(),
      ]);

      // Get base ADR from KPI summary
      const baseADR = kpiSummary?.today?.adr || 150;

      // Demand level multipliers for ADR estimation
      const demandMultipliers: Record<string, number> = {
        critical: 1.3,
        high: 1.15,
        moderate: 1.0,
        low: 0.9,
        very_low: 0.8,
      };

      // Transform forecast data to chart format
      const chartData = forecast.forecasts.map((item) => ({
        date: item.date,
        adr: Math.round(baseADR * (demandMultipliers[item.demand_level] || 1.0)),
        occupancy: Math.round(item.forecasted_occupancy),
      }));

      setData(chartData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch ADR/Occupancy data:', err);
      setError('Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, item) => sum + item.adr, 0) / data.length);
  }, [data]);

  const avgOccupancy = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, item) => sum + item.occupancy, 0) / data.length);
  }, [data]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 animate-pulse" />
            <div>
              <div className="h-5 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-40 bg-neutral-100 rounded animate-pulse mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="h-10 w-20 bg-neutral-100 rounded animate-pulse" />
            <div className="h-10 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-[280px] bg-neutral-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  // Error state
  if (error && data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
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
        </div>
        <div className="h-[280px] flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-neutral-500 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
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
        </div>
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-sm text-neutral-500">No forecast data available</p>
        </div>
      </div>
    );
  }

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
            <p className="text-lg font-bold text-[#5C9BA4]">${avgADR.toLocaleString()}</p>
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
              tickFormatter={(value) => `$${value}`}
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
            ${Math.max(...data.map(d => d.adr)).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-neutral-500">Lowest ADR</p>
          <p className="text-sm font-bold text-neutral-600">
            ${Math.min(...data.map(d => d.adr)).toLocaleString()}
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
