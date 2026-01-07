import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart3,
  Calendar,
  Building2
} from 'lucide-react';

const formatCurrency = (value) => {
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  return `₹${value.toLocaleString()}`;
};

export default function KPICards({ data }) {
  const kpis = [
    {
      id: 'todayRevenue',
      label: "Today's Revenue",
      value: formatCurrency(data.todayRevenue || 0),
      icon: DollarSign,
      accentColor: 'terra',
      trend: data.todayRevenue > data.yesterdayRevenue ? 'up' : 'down',
      trendValue: data.yesterdayRevenue
        ? Math.round(((data.todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100)
        : 0
    },
    {
      id: 'adr',
      label: 'ADR',
      value: `₹${(data.adr || 0).toLocaleString()}`,
      icon: Building2,
      accentColor: 'ocean',
      subLabel: 'Avg Daily Rate'
    },
    {
      id: 'revpar',
      label: 'RevPAR',
      value: `₹${(data.revpar || 0).toLocaleString()}`,
      icon: BarChart3,
      accentColor: 'sage',
      subLabel: 'Revenue Per Room'
    },
    {
      id: 'occupancy',
      label: 'Occupancy',
      value: `${data.occupancy || 0}%`,
      icon: Percent,
      accentColor: 'gold',
      progress: data.occupancy || 0
    },
    {
      id: 'forecast',
      label: '7-Day Forecast',
      value: formatCurrency(data.forecastedRevenue7Days || 0),
      icon: Calendar,
      accentColor: 'terra',
      subLabel: 'Projected revenue'
    },
    {
      id: 'growth',
      label: 'Revenue Growth',
      value: `${data.growth > 0 ? '+' : ''}${data.growth || 0}%`,
      icon: data.growth >= 0 ? TrendingUp : TrendingDown,
      accentColor: data.growth >= 0 ? 'sage' : 'rose',
      subLabel: 'vs Last Week'
    }
  ];

  const accentStyles = {
    terra: { bg: 'bg-terra-50', icon: 'text-terra-600', progress: '#A57865' },
    sage: { bg: 'bg-sage-50', icon: 'text-sage-600', progress: '#4E5840' },
    gold: { bg: 'bg-gold-50', icon: 'text-gold-600', progress: '#CDB261' },
    ocean: { bg: 'bg-ocean-50', icon: 'text-ocean-600', progress: '#5C9BA4' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', progress: '#DC2626' },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        const style = accentStyles[kpi.accentColor] || accentStyles.terra;

        return (
          <div
            key={kpi.id}
            className="rounded-[10px] bg-white p-5"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Header with Icon and Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg}`}>
                <Icon className={`w-4 h-4 ${style.icon}`} />
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                {kpi.label}
              </p>
            </div>

            {/* Value */}
            <p className="text-[22px] font-semibold tracking-tight text-neutral-900 mb-2">
              {kpi.value}
            </p>

            {/* Trend indicator */}
            {kpi.trend && (
              <div className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                kpi.trend === 'up' ? 'text-sage-600' : 'text-rose-600'
              }`}>
                {kpi.trend === 'up' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>{kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}% vs yesterday</span>
              </div>
            )}

            {/* Sub label */}
            {kpi.subLabel && !kpi.trend && !kpi.progress && (
              <p className="text-[11px] text-neutral-400 font-medium">{kpi.subLabel}</p>
            )}

            {/* Progress bar for occupancy */}
            {kpi.progress !== undefined && (
              <div className="mt-1">
                <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${kpi.progress}%`,
                      backgroundColor: style.progress
                    }}
                  />
                </div>
                <p className="text-[11px] text-neutral-400 font-medium mt-1">
                  {data.roomsSold || 0} / {data.totalRooms || 0} rooms
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
