import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar, Users, Target } from 'lucide-react';
import { useRMS } from '../../context/RMSContext';

const PickupChart = ({ dateRange = 14, chartType = 'area' }) => {
  const { pickup, pickupMetrics } = useRMS();

  const chartData = useMemo(() => {
    const today = new Date();
    const data = [];

    for (let i = 0; i < dateRange; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const pickupData = pickup[dateStr];

      if (pickupData) {
        data.push({
          date: dateStr,
          displayDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
          current: pickupData.currentBookings,
          expected: pickupData.expectedTotal,
          predicted: pickupData.predictedFinal,
          lastYear: pickupData.comparisons.lastYear.bookings,
          progress: pickupData.bookingProgress,
          paceStatus: pickupData.paceStatus,
          remaining: pickupData.remainingToSell,
          daysOut: pickupData.daysOut,
        });
      }
    }

    return data;
  }, [pickup, dateRange]);

  const getPaceStatusColor = (status) => {
    switch (status) {
      case 'strong': return '#4E5840';
      case 'on-pace': return '#5C9BA4';
      case 'slow': return '#CDB261';
      case 'critical': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getPaceStatusIcon = (status) => {
    switch (status) {
      case 'strong': return <TrendingUp className="w-4 h-4 text-sage-600" />;
      case 'on-pace': return <CheckCircle className="w-4 h-4 text-ocean-600" />;
      case 'slow': return <TrendingDown className="w-4 h-4 text-gold-600" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-rose-600" />;
      default: return null;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-[#E5E4E0]">
          <p className="font-semibold text-neutral-800 mb-2">{data.dayName}, {data.displayDate}</p>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Current Bookings:</span>
              <span className="font-bold text-neutral-800">{data.current}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Expected Total:</span>
              <span className="font-medium text-neutral-600">{data.expected}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Last Year:</span>
              <span className="font-medium text-neutral-600">{data.lastYear}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-neutral-500">Progress:</span>
              <span className="font-bold" style={{ color: getPaceStatusColor(data.paceStatus) }}>
                {data.progress}%
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1 border-t">
              <span className="text-neutral-500">Pace Status:</span>
              <div className="flex items-center gap-1">
                {getPaceStatusIcon(data.paceStatus)}
                <span className="font-medium capitalize" style={{ color: getPaceStatusColor(data.paceStatus) }}>
                  {data.paceStatus?.replace('-', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (chartType === 'bar') {
    return (
      <div className="h-96 px-4 py-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="barGradientCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A57865" stopOpacity={1} />
                <stop offset="100%" stopColor="#8E6554" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" strokeOpacity={0.6} vertical={false} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
              axisLine={{ stroke: '#E5E4E0', strokeWidth: 1 }}
              tickLine={false}
              tickMargin={12}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#A57865', opacity: 0.05 }} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => <span style={{ color: '#6B7280', fontSize: '13px', fontWeight: 600 }}>{value}</span>}
            />
            <Bar
              dataKey="current"
              name="Current Bookings"
              fill="url(#barGradientCurrent)"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
            <Bar
              dataKey="remaining"
              name="Remaining to Sell"
              fill="#E5E4E0"
              radius={[8, 8, 0, 0]}
              maxBarSize={60}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-96 px-4 py-6">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#A57865" stopOpacity={0.6} />
              <stop offset="50%" stopColor="#A57865" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#A57865" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5C9BA4" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#5C9BA4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5C9BA4" stopOpacity={0.05} />
            </linearGradient>
            <filter id="shadow" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#A57865" floodOpacity="0.2"/>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#9CA3AF" strokeOpacity={0.6} vertical={false} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickLine={false}
            tickMargin={12}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280', fontWeight: 500 }}
            axisLine={false}
            tickLine={false}
            tickMargin={10}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#A57865', strokeWidth: 1, strokeDasharray: '4 4', strokeOpacity: 0.3 }} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
            formatter={(value) => <span style={{ color: '#6B7280', fontSize: '13px', fontWeight: 600 }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="expected"
            name="Expected Total"
            stroke="#3B8A94"
            strokeWidth={3}
            strokeDasharray="5 5"
            fill="url(#colorExpected)"
            dot={false}
            activeDot={{ r: 6, fill: '#3B8A94', stroke: '#fff', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="current"
            name="Current Bookings"
            stroke="#8E6554"
            strokeWidth={3.5}
            fill="url(#colorCurrent)"
            dot={false}
            activeDot={{ r: 7, fill: '#8E6554', stroke: '#fff', strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="lastYear"
            name="Last Year"
            stroke="#B8A055"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={{ r: 5, fill: '#B8A055', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Pickup Summary Card Component - Matches KPICard pattern
export const PickupSummaryCard = ({ period = 'next7Days' }) => {
  const { pickupMetrics } = useRMS();
  const metrics = pickupMetrics[period];

  if (!metrics) return null;

  const accentColors = {
    next7Days: { bg: 'bg-terra-50', icon: 'text-terra-600' },
    next14Days: { bg: 'bg-ocean-50', icon: 'text-ocean-600' },
    next30Days: { bg: 'bg-sage-50', icon: 'text-sage-600' },
  };

  const style = accentColors[period] || accentColors.next7Days;

  return (
    <div className="relative overflow-hidden rounded-[10px] bg-white p-6">
      {/* Header with Icon and Title */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg}`}>
          <Calendar className={`w-4 h-4 ${style.icon}`} />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
          {period === 'next7Days' ? 'Next 7 Days' : period === 'next14Days' ? 'Next 14 Days' : 'Next 30 Days'}
        </p>
      </div>

      {/* Main Value */}
      <p className="text-[28px] font-semibold tracking-tight text-neutral-900 mb-2">
        {metrics.avgBookings} <span className="text-[15px] font-medium text-neutral-400">avg bookings</span>
      </p>

      {/* Progress */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] text-neutral-400 font-medium">Avg Progress</p>
        <p className="text-[15px] font-semibold text-neutral-800">{metrics.avgProgress}%</p>
      </div>

      {/* Pace Indicators */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-sage-50">
          <TrendingUp className="w-3 h-3 text-sage-600" />
          <span className="text-[11px] font-semibold text-sage-600">{metrics.strongDays} strong</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-rose-50">
          <AlertCircle className="w-3 h-3 text-rose-600" />
          <span className="text-[11px] font-semibold text-rose-600">{metrics.criticalDays} critical</span>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-medium">Rooms to Sell</span>
          <span className="text-[15px] font-semibold text-terra-600">{metrics.totalRemaining}</span>
        </div>
      </div>
    </div>
  );
};

// Pickup Pace Indicator
export const PickupPaceIndicator = ({ date }) => {
  const { pickup } = useRMS();
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  const data = pickup[dateStr];

  if (!data) return null;

  const getStatusStyles = (status) => {
    switch (status) {
      case 'strong':
        return 'bg-sage-50 border-sage-200 text-sage-700';
      case 'on-pace':
        return 'bg-ocean-50 border-ocean-200 text-ocean-700';
      case 'slow':
        return 'bg-gold-50 border-gold-200 text-gold-700';
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-neutral-50 border-neutral-200 text-neutral-700';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusStyles(data.paceStatus)}`}>
      {getPaceStatusIcon(data.paceStatus)}
      <span className="text-sm font-medium capitalize">{data.paceStatus?.replace('-', ' ')}</span>
      <span className="text-sm opacity-75">• {data.bookingProgress}%</span>
    </div>
  );

  function getPaceStatusIcon(status) {
    switch (status) {
      case 'strong': return <TrendingUp className="w-4 h-4" />;
      case 'on-pace': return <CheckCircle className="w-4 h-4" />;
      case 'slow': return <TrendingDown className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  }
};

export default PickupChart;
