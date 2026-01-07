import { TrendingUp, TrendingDown, Minus, ExternalLink } from 'lucide-react';

export default function ChannelPerformanceTable({ channelData, summary }) {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-[#4E5840]" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up':
        return 'text-[#4E5840]';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-neutral-600';
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 border border-neutral-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-serif font-semibold text-neutral-900 mb-1">
            Channel Performance
          </h3>
          <p className="text-sm text-neutral-600">
            Revenue breakdown by distribution channel
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#A57865] hover:bg-[#A57865]/5 rounded-lg transition-colors">
          <ExternalLink className="w-4 h-4" />
          View Details
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Channel
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Revenue
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Bookings
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                ADR
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Commission
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Net Revenue
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {channelData.map((channel, index) => (
              <tr
                key={channel.id}
                className={`border-b border-neutral-100 hover:bg-[#FAF8F6] transition-colors ${
                  index === 0 ? 'bg-[#A57865]/5/30' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-8 rounded-full bg-[#8E6554]" />
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">
                        {channel.channel}
                      </p>
                      <p className="text-xs text-neutral-500">{channel.percentage}% share</p>
                    </div>
                  </div>
                </td>
                <td className="text-right py-4 px-4">
                  <p className="font-semibold text-neutral-900">
                    ${channel.revenue.toLocaleString()}
                  </p>
                </td>
                <td className="text-right py-4 px-4">
                  <p className="text-neutral-700">{channel.bookings}</p>
                </td>
                <td className="text-right py-4 px-4">
                  <p className="text-neutral-700">${channel.adr}</p>
                </td>
                <td className="text-right py-4 px-4">
                  <p className="text-neutral-700">{channel.commission}%</p>
                </td>
                <td className="text-right py-4 px-4">
                  <p className="font-semibold text-[#4E5840]">
                    ${channel.netRevenue.toLocaleString()}
                  </p>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex items-center justify-center gap-2">
                    {getTrendIcon(channel.trend)}
                    <span className={`text-sm font-semibold ${getTrendColor(channel.trend)}`}>
                      {channel.growth > 0 ? '+' : ''}{channel.growth.toFixed(1)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#FAF8F6] font-semibold">
              <td className="py-4 px-4 text-neutral-900">Total</td>
              <td className="text-right py-4 px-4 text-[#A57865]">
                ${summary.totalRevenue.toLocaleString()}
              </td>
              <td className="text-right py-4 px-4 text-neutral-900">
                {summary.totalBookings}
              </td>
              <td className="text-right py-4 px-4 text-neutral-900">
                -
              </td>
              <td className="text-right py-4 px-4 text-neutral-900">
                {summary.avgCommission}%
              </td>
              <td className="text-right py-4 px-4 text-[#4E5840]">
                ${summary.totalNetRevenue.toLocaleString()}
              </td>
              <td className="text-center py-4 px-4">-</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="p-4 bg-[#4E5840]/10 rounded-xl border border-[#4E5840]/30">
          <p className="text-xs text-[#4E5840] font-medium mb-1">Best Performer</p>
          <p className="text-lg font-bold text-green-900">Direct Booking</p>
          <p className="text-xs text-[#4E5840] mt-1">0% commission</p>
        </div>
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-xs text-amber-700 font-medium mb-1">Total Commission</p>
          <p className="text-lg font-bold text-amber-900">
            ${(summary.totalRevenue - summary.totalNetRevenue).toLocaleString()}
          </p>
          <p className="text-xs text-amber-600 mt-1">From all channels</p>
        </div>
        <div className="p-4 bg-[#A57865]/5 rounded-xl border border-[#A57865]/30">
          <p className="text-xs text-[#A57865] font-medium mb-1">Avg Conversion</p>
          <p className="text-lg font-bold text-neutral-900">
            {(channelData.reduce((sum, c) => sum + c.conversionRate, 0) / channelData.length).toFixed(1)}%
          </p>
          <p className="text-xs text-[#A57865] mt-1">Across channels</p>
        </div>
      </div>
    </div>
  );
}
