import { useMemo } from 'react';
import { Star, MapPin, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

export default function CompetitorTable({ data, yourRate = 7800 }) {
  const avgCompetitorRate = useMemo(() => {
    return Math.round(data.reduce((sum, c) => sum + c.next7, 0) / data.length);
  }, [data]);

  const marketDiff = useMemo(() => {
    return Math.round(((yourRate - avgCompetitorRate) / avgCompetitorRate) * 100);
  }, [yourRate, avgCompetitorRate]);

  const getPositionInfo = (competitorRate) => {
    const diff = ((yourRate - competitorRate) / competitorRate) * 100;
    if (diff > 5) return { label: 'Higher', isHigher: true };
    if (diff < -5) return { label: 'Lower', isHigher: false };
    return { label: 'Similar', isHigher: null };
  };

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">Competitor Rates</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">{data.length} hotels monitored</p>
          </div>

          {/* Rate Comparison */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[11px] text-neutral-400 font-medium">Your Rate</p>
              <p className="text-lg font-bold text-neutral-900">₹{yourRate.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-neutral-200" />
            <div className="text-right">
              <p className="text-[11px] text-neutral-400 font-medium">Market Avg</p>
              <p className="text-lg font-bold text-neutral-500">₹{avgCompetitorRate.toLocaleString()}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold ${
              marketDiff > 0 ? 'bg-gold-50 text-gold-700' : marketDiff < 0 ? 'bg-sage-50 text-sage-700' : 'bg-neutral-100 text-neutral-600'
            }`}>
              {marketDiff !== 0 && (
                marketDiff > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
              )}
              <span>
                {marketDiff > 0 ? `${marketDiff}% above` : marketDiff < 0 ? `${Math.abs(marketDiff)}% below` : 'At market'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Competitor List */}
      <div className="divide-y divide-neutral-100">
        {data.map((competitor) => {
          const position = getPositionInfo(competitor.next7);

          return (
            <div
              key={competitor.id}
              className="px-6 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Hotel Info */}
                <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-bold text-neutral-500">
                    {competitor.hotel.charAt(0)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-900">{competitor.hotel}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                      <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                      <span>{competitor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                      <MapPin className="w-3 h-3" />
                      <span>{competitor.distance}</span>
                    </div>
                  </div>
                </div>

                {/* Rates */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Today</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">₹{competitor.today.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">7-Day Avg</p>
                    <p className="text-[15px] font-bold text-neutral-600 mt-0.5">₹{competitor.next7.toLocaleString()}</p>
                  </div>
                </div>

                {/* Position Badge */}
                <div className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold min-w-[60px] text-center ${
                  position.isHigher === true ? 'bg-gold-50 text-gold-700' :
                  position.isHigher === false ? 'bg-sage-50 text-sage-700' :
                  'bg-neutral-100 text-neutral-600'
                }`}>
                  {position.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Insight */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-gold-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-neutral-800 mb-0.5">Market Insight</p>
            <p className="text-[13px] text-neutral-600 leading-relaxed">
              {marketDiff > 0 ? (
                <>Your rates are <span className="font-semibold text-gold-700">{marketDiff}% above</span> market average. Consider if your value proposition justifies the premium.</>
              ) : marketDiff < 0 ? (
                <>Your rates are <span className="font-semibold text-sage-700">{Math.abs(marketDiff)}% below</span> market average. There may be room to increase rates.</>
              ) : (
                <>Your rates are competitive with the market. Monitor demand to optimize pricing.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
