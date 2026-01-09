import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  BarChart3,
  Calendar,
  Building2
} from 'lucide-react';

interface KPIData {
  // API format (snake_case)
  total_revenue?: number;
  revenue_trend?: number;
  adr?: number;
  adr_trend?: number;
  revpar?: number;
  revpar_trend?: number;
  occupancy?: number;
  occupancy_trend?: number;
  occupied_room_nights?: number;
  available_room_nights?: number;
  // Legacy format (camelCase)
  todayRevenue?: number;
  yesterdayRevenue?: number;
  forecastedRevenue7Days?: number;
  growth?: number;
  roomsSold?: number;
  totalRooms?: number;
}

interface KPICardsProps {
  data?: KPIData | null;
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
};

export default function KPICards({ data }: KPICardsProps) {
  // Loading skeleton when no data
  if (!data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-[10px] bg-white p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 animate-pulse" />
              <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
            </div>
            <div className="h-7 w-24 bg-neutral-200 rounded animate-pulse mb-2" />
            <div className="h-3 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Normalize data - handle both API format and legacy format
  const todayRevenue = data.total_revenue ?? data.todayRevenue ?? 0;
  const revenueTrend = data.revenue_trend ?? (data.yesterdayRevenue ? Math.round(((todayRevenue - data.yesterdayRevenue) / data.yesterdayRevenue) * 100) : 0);
  const adr = data.adr ?? 0;
  const revpar = data.revpar ?? 0;
  const occupancy = data.occupancy ?? 0;
  const roomsSold = data.occupied_room_nights ?? data.roomsSold ?? 0;
  const totalRooms = data.available_room_nights ?? data.totalRooms ?? 0;
  const forecastedRevenue = data.forecastedRevenue7Days ?? (todayRevenue * 7) ?? 0;
  const growth = data.revenue_trend ?? data.growth ?? 0;

  const kpis = [
    {
      id: 'todayRevenue',
      label: "Today's Revenue",
      value: formatCurrency(todayRevenue),
      icon: DollarSign,
      accentColor: 'terra',
      trend: revenueTrend >= 0 ? 'up' : 'down',
      trendValue: revenueTrend
    },
    {
      id: 'adr',
      label: 'ADR',
      value: `$${adr.toLocaleString()}`,
      icon: Building2,
      accentColor: 'ocean',
      subLabel: 'Avg Daily Rate'
    },
    {
      id: 'revpar',
      label: 'RevPAR',
      value: `$${revpar.toLocaleString()}`,
      icon: BarChart3,
      accentColor: 'sage',
      subLabel: 'Revenue Per Room'
    },
    {
      id: 'occupancy',
      label: 'Occupancy',
      value: `${occupancy}%`,
      icon: Percent,
      accentColor: 'gold',
      progress: occupancy
    },
    {
      id: 'forecast',
      label: '7-Day Forecast',
      value: formatCurrency(forecastedRevenue),
      icon: Calendar,
      accentColor: 'terra',
      subLabel: 'Projected revenue'
    },
    {
      id: 'growth',
      label: 'Revenue Growth',
      value: `${growth > 0 ? '+' : ''}${growth}%`,
      icon: growth >= 0 ? TrendingUp : TrendingDown,
      accentColor: growth >= 0 ? 'sage' : 'rose',
      subLabel: 'vs Last Period'
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
                  {roomsSold} / {totalRooms} rooms
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
