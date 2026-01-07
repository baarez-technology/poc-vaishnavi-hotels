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
      color: '#A57865',
      bgColor: 'bg-[#A57865]/10',
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
      color: '#5C9BA4',
      bgColor: 'bg-[#5C9BA4]/10',
      subLabel: 'Avg Daily Rate'
    },
    {
      id: 'revpar',
      label: 'RevPAR',
      value: `₹${(data.revpar || 0).toLocaleString()}`,
      icon: BarChart3,
      color: '#4E5840',
      bgColor: 'bg-[#4E5840]/10',
      subLabel: 'Revenue Per Available Room'
    },
    {
      id: 'occupancy',
      label: 'Occupancy',
      value: `${data.occupancy || 0}%`,
      icon: Percent,
      color: '#CDB261',
      bgColor: 'bg-[#CDB261]/10',
      progress: data.occupancy || 0
    },
    {
      id: 'forecast',
      label: 'Forecasted Revenue',
      value: formatCurrency(data.forecastedRevenue7Days || 0),
      icon: Calendar,
      color: '#8E6554',
      bgColor: 'bg-[#8E6554]/10',
      subLabel: 'Next 7 Days'
    },
    {
      id: 'growth',
      label: 'Revenue Growth',
      value: `${data.growth > 0 ? '+' : ''}${data.growth || 0}%`,
      icon: data.growth >= 0 ? TrendingUp : TrendingDown,
      color: data.growth >= 0 ? '#4E5840' : '#DC2626',
      bgColor: data.growth >= 0 ? 'bg-[#4E5840]/10' : 'bg-red-100',
      subLabel: 'vs Last Week'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-xl border border-[#E5E5E5] p-5 relative overflow-hidden group hover:shadow-md transition-shadow"
          >
            {/* Icon */}
            <div className={`absolute top-4 right-4 w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
              <Icon className="w-5 h-5" style={{ color: kpi.color }} />
            </div>

            {/* Content */}
            <div className="pr-12">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold text-neutral-900" style={{ color: kpi.color }}>
                {kpi.value}
              </p>

              {/* Trend indicator */}
              {kpi.trend && (
                <div className={`flex items-center gap-1 mt-2 text-xs ${
                  kpi.trend === 'up' ? 'text-[#4E5840]' : 'text-red-600'
                }`}>
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}% vs yesterday</span>
                </div>
              )}

              {/* Sub label */}
              {kpi.subLabel && (
                <p className="text-xs text-neutral-400 mt-2">{kpi.subLabel}</p>
              )}

              {/* Progress bar for occupancy */}
              {kpi.progress !== undefined && (
                <div className="mt-3">
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${kpi.progress}%`,
                        backgroundColor: kpi.color
                      }}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    {data.roomsSold || 0} / {data.totalRooms || 0} rooms
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
