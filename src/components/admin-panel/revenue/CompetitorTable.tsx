import { useMemo } from 'react';
import { Building, TrendingUp, TrendingDown, Minus, Star, MapPin } from 'lucide-react';

export default function CompetitorTable({ data, yourRate = 7800 }) {
  const getPositionData = (competitor) => {
    const avgCompetitorRate = competitor.next7;
    const diff = yourRate - avgCompetitorRate;
    const percentDiff = Math.round((diff / avgCompetitorRate) * 100);

    if (percentDiff > 5) {
      return {
        label: 'Above',
        color: '#A57865',
        bgColor: 'bg-[#A57865]/10',
        icon: TrendingUp,
        suggestion: '-5%',
        suggestionColor: '#DC2626'
      };
    } else if (percentDiff < -5) {
      return {
        label: 'Below',
        color: '#4E5840',
        bgColor: 'bg-[#4E5840]/10',
        icon: TrendingDown,
        suggestion: '+5%',
        suggestionColor: '#4E5840'
      };
    } else {
      return {
        label: 'Competitive',
        color: '#5C9BA4',
        bgColor: 'bg-[#5C9BA4]/10',
        icon: Minus,
        suggestion: 'Hold',
        suggestionColor: '#5C9BA4'
      };
    }
  };

  const avgCompetitorRate = useMemo(() => {
    return Math.round(data.reduce((sum, c) => sum + c.next7, 0) / data.length);
  }, [data]);

  const yourPosition = useMemo(() => {
    const diff = ((yourRate - avgCompetitorRate) / avgCompetitorRate) * 100;
    if (diff > 5) return { label: 'Above Market', color: '#A57865' };
    if (diff < -5) return { label: 'Below Market', color: '#4E5840' };
    return { label: 'At Market', color: '#5C9BA4' };
  }, [yourRate, avgCompetitorRate]);

  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#CDB261]/10 flex items-center justify-center">
            <Building className="w-5 h-5 text-[#CDB261]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Competitor Rates</h3>
            <p className="text-sm text-neutral-500">Market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-neutral-500">Your Rate</p>
            <p className="text-lg font-bold text-neutral-900">₹{yourRate.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">Market Avg</p>
            <p className="text-lg font-bold text-neutral-600">₹{avgCompetitorRate.toLocaleString()}</p>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${yourPosition.color}20`, color: yourPosition.color }}>
            {yourPosition.label}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#FAF7F4] border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Hotel
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Today's Rate
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                7-Day Avg
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Position
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                Suggested Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((competitor) => {
              const position = getPositionData(competitor);
              const Icon = position.icon;

              return (
                <tr key={competitor.id} className="hover:bg-[#FAF7F4]/50 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-lg font-bold text-neutral-500">
                        {competitor.hotel.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{competitor.hotel}</p>
                        <div className="flex items-center gap-2 text-xs text-neutral-500">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-[#CDB261] fill-[#CDB261]" />
                            <span>{competitor.rating}</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            <span>{competitor.distance}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-neutral-900">
                      ₹{competitor.today.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className="font-semibold text-neutral-700">
                      ₹{competitor.next7.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${position.bgColor}`}>
                      <Icon className="w-3 h-3" style={{ color: position.color }} />
                      <span className="text-xs font-semibold" style={{ color: position.color }}>
                        {position.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: `${position.suggestionColor}15`, color: position.suggestionColor }}
                    >
                      {position.suggestion}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-4 p-4 bg-[#FAF7F4] rounded-xl">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-[#CDB261]">Market Analysis:</span>
          {' '}
          {yourRate > avgCompetitorRate ? (
            <>
              Your rates are {Math.round(((yourRate - avgCompetitorRate) / avgCompetitorRate) * 100)}% above market average.
              Consider if your value proposition justifies the premium.
            </>
          ) : yourRate < avgCompetitorRate ? (
            <>
              Your rates are {Math.round(((avgCompetitorRate - yourRate) / avgCompetitorRate) * 100)}% below market average.
              There may be room to increase rates while remaining competitive.
            </>
          ) : (
            <>
              Your rates are competitive with the market. Monitor demand to optimize pricing.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
