import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Bar, Line } from 'recharts';
import { TrendingUp, TrendingDown, Flame, Snowflake, Calendar } from 'lucide-react';
import { useRMS } from '../../context/RMSContext';

const DemandChart = ({ dateRange = 30, showRevenue = true }) => {
  const { forecast } = useRMS();

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];

    for (let i = 0; i < dateRange; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const forecastData = forecast[dateStr];

      if (forecastData) {
        data.push({
          date: dateStr,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          occupancy: forecastData.forecast.occupancy,
          adr: forecastData.forecast.adr,
          revPAR: forecastData.forecast.revPAR,
          revenue: forecastData.forecast.revenue,
          demandIndex: Math.round(forecastData.demandIndex * 100),
          demandLevel: forecastData.demandLevel,
          event: forecastData.event,
          confidence: forecastData.confidenceScore,
        });
      }
    }

    return data;
  }, [forecast, dateRange]);

  const getDemandLevelColor = (level) => {
    switch (level) {
      case 'compression': return '#DC2626';
      case 'high': return '#4E5840';
      case 'normal': return '#5C9BA4';
      case 'low': return '#CDB261';
      case 'very_low': return '#9CA3AF';
      default: return '#6B7280';
    }
  };

  const getDemandLevelIcon = (level) => {
    switch (level) {
      case 'compression': return <Flame className="w-4 h-4 text-rose-500" />;
      case 'high': return <TrendingUp className="w-4 h-4 text-sage-600" />;
      case 'normal': return null;
      case 'low': return <TrendingDown className="w-4 h-4 text-gold-500" />;
      case 'very_low': return <Snowflake className="w-4 h-4 text-ocean-400" />;
      default: return null;
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-[#E5E4E0] min-w-[220px]">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-neutral-800">{data.dayName}, {data.displayDate}</p>
            {data.event && (
              <span className="text-xs px-2 py-0.5 bg-[#4E5840]/10 text-[#4E5840] rounded-full">
                {data.event.name}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">Occupancy:</span>
              <span className="font-bold text-neutral-800">{data.occupancy}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">ADR:</span>
              <span className="font-bold text-neutral-800">${data.adr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500">RevPAR:</span>
              <span className="font-bold text-neutral-800">${data.revPAR}</span>
            </div>
            {showRevenue && (
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Revenue:</span>
                <span className="font-bold text-sage-600">${data.revenue.toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-neutral-500">Demand Level:</span>
              <div className="flex items-center gap-1">
                {getDemandLevelIcon(data.demandLevel)}
                <span className="font-medium capitalize" style={{ color: getDemandLevelColor(data.demandLevel) }}>
                  {data.demandLevel?.replace('_', ' ')}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span>Confidence:</span>
              <span>{data.confidence}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom bar for demand index with color based on level
  const CustomDemandBar = (props) => {
    const { x, y, width, height, payload } = props;
    const color = getDemandLevelColor(payload.demandLevel);
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        rx={2}
        opacity={0.8}
      />
    );
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A57865" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#A57865" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 10, fill: '#6A6A6A' }}
            axisLine={{ stroke: '#E5E4E0' }}
            tickLine={false}
            interval={Math.floor(dateRange / 10)}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: '#6A6A6A' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 11, fill: '#6A6A6A' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey="occupancy"
            name="Occupancy %"
            stroke="#A57865"
            strokeWidth={2}
            fill="url(#colorOccupancy)"
          />
          <Bar
            yAxisId="left"
            dataKey="demandIndex"
            name="Demand Index"
            shape={<CustomDemandBar />}
            barSize={8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="adr"
            name="ADR"
            stroke="#5C9BA4"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revPAR"
            name="RevPAR"
            stroke="#CDB261"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

// Demand Level Badge Component (Accessible with patterns + icons + text)
export const DemandLevelBadge = ({ level }) => {
  const getStyles = () => {
    switch (level) {
      case 'compression':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'high':
        return 'bg-sage-50 text-sage-700 border-sage-200';
      case 'normal':
        return 'bg-ocean-50 text-ocean-700 border-ocean-200';
      case 'low':
        return 'bg-gold-50 text-gold-700 border-gold-200';
      case 'very_low':
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
      default:
        return 'bg-neutral-100 text-neutral-600 border-neutral-200';
    }
  };

  const getIcon = () => {
    switch (level) {
      case 'compression': return <Flame className="w-3 h-3" aria-hidden="true" />;
      case 'high': return <TrendingUp className="w-3 h-3" aria-hidden="true" />;
      case 'low': return <TrendingDown className="w-3 h-3" aria-hidden="true" />;
      case 'very_low': return <Snowflake className="w-3 h-3" aria-hidden="true" />;
      default: return null;
    }
  };

  const levelText = level?.replace('_', ' ');

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-md border ${getStyles()}`}
      role="status"
      aria-label={`Demand level: ${levelText}`}
    >
      {getIcon()}
      <span className="capitalize">{levelText}</span>
    </span>
  );
};

// Forecast Summary Cards
export const ForecastSummaryCards = () => {
  const { forecastSummary } = useRMS();

  const periods = [
    { key: 'next7Days', label: 'Next 7 Days' },
    { key: 'next14Days', label: 'Next 14 Days' },
    { key: 'next30Days', label: 'Next 30 Days' },
  ];

  return (
    <>
      {periods.map(({ key, label }) => {
        const data = forecastSummary[key];
        if (!data) return null;

        return (
          <div
            key={key}
            className="rounded-[10px] bg-white p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">
                {label}
              </p>
              <div className="w-10 h-10 rounded-lg bg-terra-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-terra-500" />
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500">Avg Occupancy</span>
                <span className="text-xl font-bold text-neutral-900">
                  {data.avgOccupancy}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500">Avg ADR</span>
                <span className="text-xl font-bold text-neutral-900">
                  ${data.avgADR}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-neutral-500">Avg RevPAR</span>
                <span className="text-xl font-bold text-terra-600">
                  ${data.avgRevPAR}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest">Total Revenue</span>
                <span className="text-lg font-bold text-sage-600">
                  ${data.totalRevenue.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium text-neutral-600">
                  {data.compressionDays} compression
                </span>
              </span>
              <span className="flex items-center gap-1">
                <Snowflake className="w-3.5 h-3.5 text-ocean-400" />
                <span className="font-medium text-neutral-600">
                  {data.lowDemandDays} low
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </>
  );
};

export default DemandChart;
