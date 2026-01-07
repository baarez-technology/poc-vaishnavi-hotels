import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function PickupAnalysis({ pickupData, onTheBooks, paceIndicators }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      return (
        <div className="bg-white p-4 rounded-xl shadow-lg border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-2">{data.label}</p>
          <div className="space-y-1">
            <p className="text-sm text-[#A57865]">
              <span className="font-medium">Current:</span> {data.currentYear} rooms
            </p>
            <p className="text-sm text-neutral-600">
              <span className="font-medium">Last Year:</span> {data.lastYear} rooms
            </p>
            <p className={`text-sm font-semibold ${
              data.variance >= 0 ? 'text-[#4E5840]' : 'text-rose-600'
            }`}>
              {data.variance >= 0 ? '+' : ''}{data.variance.toFixed(1)}% variance
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Booking Pace Chart */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <div className="mb-6">
          <h3 className="text-xl font-sans font-semibold text-neutral-900 mb-1">
            Booking Pace Analysis
          </h3>
          <p className="text-sm text-neutral-600">
            Current year vs last year by booking window
          </p>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pickupData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar
              dataKey="currentYear"
              fill="#2563eb"
              radius={[8, 8, 0, 0]}
              name="Current Year"
            />
            <Bar
              dataKey="lastYear"
              fill="#d1d5db"
              radius={[8, 8, 0, 0]}
              name="Last Year"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* On-The-Books Summary */}
      <div className="bg-white rounded-xl p-6 border border-neutral-200">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-[#A57865]" />
          <h3 className="text-xl font-sans font-semibold text-neutral-900">
            On-The-Books
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Next 7 Days */}
          <div className="p-4 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-[#A57865]/30">
            <p className="text-xs font-semibold text-[#A57865] uppercase mb-2">
              Next 7 Days
            </p>
            <p className="text-3xl font-bold text-neutral-900 mb-2">
              {onTheBooks.next7Days.rooms}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#A57865]">Revenue:</span>
                <span className="font-semibold text-neutral-900">
                  ${(onTheBooks.next7Days.revenue / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A57865]">Occupancy:</span>
                <span className="font-semibold text-neutral-900">
                  {onTheBooks.next7Days.occupancy}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A57865]">ADR:</span>
                <span className="font-semibold text-neutral-900">
                  ${onTheBooks.next7Days.adr}
                </span>
              </div>
            </div>
          </div>

          {/* Next 14 Days */}
          <div className="p-4 bg-gradient-to-br from-aurora-50 to-aurora-100 rounded-xl border border-[#5C9BA4]/30">
            <p className="text-xs font-semibold text-[#5C9BA4] uppercase mb-2">
              Next 14 Days
            </p>
            <p className="text-3xl font-bold text-aurora-900 mb-2">
              {onTheBooks.next14Days.rooms}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5C9BA4]">Revenue:</span>
                <span className="font-semibold text-aurora-900">
                  ${(onTheBooks.next14Days.revenue / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C9BA4]">Occupancy:</span>
                <span className="font-semibold text-aurora-900">
                  {onTheBooks.next14Days.occupancy}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C9BA4]">ADR:</span>
                <span className="font-semibold text-aurora-900">
                  ${onTheBooks.next14Days.adr}
                </span>
              </div>
            </div>
          </div>

          {/* Next 30 Days */}
          <div className="p-4 bg-gradient-to-br from-sunset-50 to-sunset-100 rounded-xl border border-[#CDB261]/30">
            <p className="text-xs font-semibold text-[#CDB261] uppercase mb-2">
              Next 30 Days
            </p>
            <p className="text-3xl font-bold text-sunset-900 mb-2">
              {onTheBooks.next30Days.rooms}
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#CDB261]">Revenue:</span>
                <span className="font-semibold text-sunset-900">
                  ${(onTheBooks.next30Days.revenue / 1000).toFixed(1)}K
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#CDB261]">Occupancy:</span>
                <span className="font-semibold text-sunset-900">
                  {onTheBooks.next30Days.occupancy}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#CDB261]">ADR:</span>
                <span className="font-semibold text-sunset-900">
                  ${onTheBooks.next30Days.adr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pace Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Pace */}
        <div className={`p-4 rounded-xl border ${
          paceIndicators.overall.status === 'ahead'
            ? 'bg-[#4E5840]/10 border-[#4E5840]/30'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {paceIndicators.overall.status === 'ahead' ? (
              <TrendingUp className="w-5 h-5 text-[#4E5840]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            )}
            <span className={`text-sm font-semibold ${
              paceIndicators.overall.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-700'
            }`}>
              Overall Pace
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            paceIndicators.overall.status === 'ahead' ? 'text-green-900' : 'text-rose-900'
          }`}>
            {paceIndicators.overall.percentage > 0 ? '+' : ''}{paceIndicators.overall.percentage}%
          </p>
          <p className={`text-xs ${
            paceIndicators.overall.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-600'
          }`}>
            {paceIndicators.overall.description}
          </p>
        </div>

        {/* Short-term Pace */}
        <div className={`p-4 rounded-xl border ${
          paceIndicators.shortTerm.status === 'ahead'
            ? 'bg-[#4E5840]/10 border-[#4E5840]/30'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {paceIndicators.shortTerm.status === 'ahead' ? (
              <TrendingUp className="w-5 h-5 text-[#4E5840]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            )}
            <span className={`text-sm font-semibold ${
              paceIndicators.shortTerm.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-700'
            }`}>
              Short-term
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            paceIndicators.shortTerm.status === 'ahead' ? 'text-green-900' : 'text-rose-900'
          }`}>
            {paceIndicators.shortTerm.percentage > 0 ? '+' : ''}{paceIndicators.shortTerm.percentage}%
          </p>
          <p className={`text-xs ${
            paceIndicators.shortTerm.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-600'
          }`}>
            {paceIndicators.shortTerm.description}
          </p>
        </div>

        {/* Long-term Pace */}
        <div className={`p-4 rounded-xl border ${
          paceIndicators.longTerm.status === 'ahead'
            ? 'bg-[#4E5840]/10 border-[#4E5840]/30'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {paceIndicators.longTerm.status === 'ahead' ? (
              <TrendingUp className="w-5 h-5 text-[#4E5840]" />
            ) : (
              <TrendingDown className="w-5 h-5 text-rose-600" />
            )}
            <span className={`text-sm font-semibold ${
              paceIndicators.longTerm.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-700'
            }`}>
              Long-term
            </span>
          </div>
          <p className={`text-2xl font-bold mb-1 ${
            paceIndicators.longTerm.status === 'ahead' ? 'text-green-900' : 'text-rose-900'
          }`}>
            {paceIndicators.longTerm.percentage}%
          </p>
          <p className={`text-xs ${
            paceIndicators.longTerm.status === 'ahead' ? 'text-[#4E5840]' : 'text-rose-600'
          }`}>
            {paceIndicators.longTerm.description}
          </p>
        </div>
      </div>
    </div>
  );
}
