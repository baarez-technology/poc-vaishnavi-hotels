import { useMemo } from 'react';
import { Sparkles, TrendingUp, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '../ui2/Button';

const ROOM_TYPES = [
  { id: 'standard', name: 'Standard Room', baseRate: 6500 },
  { id: 'deluxe', name: 'Deluxe Room', baseRate: 8500 },
  { id: 'suite', name: 'Executive Suite', baseRate: 14500 },
  { id: 'presidential', name: 'Presidential Suite', baseRate: 28500 },
  { id: 'villa', name: 'Garden Villa', baseRate: 22000 }
];

export default function RateRecommendations({ forecastData, competitorData, settings }) {
  const recommendations = useMemo(() => {
    const avgDemand = forecastData.slice(0, 7).reduce((sum, d) => sum + d.demand, 0) / 7;
    const avgCompetitorRate = competitorData.reduce((sum, c) => sum + c.next7, 0) / competitorData.length;
    const yourAvgRate = 7800;

    return ROOM_TYPES.map(room => {
      let adjustment = 0;
      let demandLevel = 'moderate';

      // Demand-based adjustment
      if (avgDemand > 0.8) {
        adjustment += Math.round(Math.random() * 8 + 10);
        demandLevel = 'high';
      } else if (avgDemand >= 0.5) {
        adjustment += Math.round(Math.random() * 4 + 4);
        demandLevel = 'moderate';
      } else {
        adjustment -= Math.round(Math.random() * 7 + 5);
        demandLevel = 'low';
      }

      // Competitor-based adjustment
      const marketPosition = yourAvgRate > avgCompetitorRate * 1.1 ? 'above' :
                            yourAvgRate < avgCompetitorRate * 0.9 ? 'below' : 'at';

      if (marketPosition === 'above') {
        adjustment -= 5;
      } else if (marketPosition === 'below') {
        adjustment += 5;
      }

      const recommendedRate = Math.round(room.baseRate * (1 + adjustment / 100));
      const changePercent = Math.round(((recommendedRate - room.baseRate) / room.baseRate) * 100);

      return {
        ...room,
        recommendedRate,
        adjustment: changePercent,
        demandLevel,
        marketPosition,
        confidence: avgDemand > 0.7 ? 'high' : avgDemand > 0.4 ? 'medium' : 'low'
      };
    });
  }, [forecastData, competitorData]);

  const highConfidenceCount = useMemo(() => {
    return recommendations.filter(r => r.confidence === 'high').length;
  }, [recommendations]);

  const getDemandColor = (level) => {
    switch (level) {
      case 'high': return 'bg-sage-500 text-white';
      case 'moderate': return 'bg-gold-100 text-gold-700';
      case 'low': return 'bg-neutral-100 text-neutral-600';
      default: return 'bg-neutral-100 text-neutral-600';
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-5 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-neutral-800">AI Rate Recommendations</h3>
            <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Optimized for next 7 days</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-sage-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-sage-500" />
            <span className="text-[11px] font-semibold text-sage-700">
              {highConfidenceCount}/{recommendations.length} High Confidence
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="divide-y divide-neutral-100">
        {recommendations.map((rec) => {
          const isPositive = rec.adjustment > 0;

          return (
            <div
              key={rec.id}
              className="px-6 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                {/* Room Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-neutral-900">{rec.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getDemandColor(rec.demandLevel)}`}>
                      {rec.demandLevel.charAt(0).toUpperCase() + rec.demandLevel.slice(1)} demand
                    </span>
                  </div>
                </div>

                {/* Price Comparison */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Current</p>
                    <p className="text-[13px] font-medium text-neutral-500 mt-0.5">₹{rec.baseRate.toLocaleString()}</p>
                  </div>

                  <ArrowRight className="w-4 h-4 text-neutral-300" />

                  <div className="text-right">
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Recommended</p>
                    <p className="text-[15px] font-bold text-neutral-900 mt-0.5">₹{rec.recommendedRate.toLocaleString()}</p>
                  </div>
                </div>

                {/* Change Percentage */}
                <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                  isPositive ? 'bg-sage-50 text-sage-700' : 'bg-rose-50 text-rose-600'
                }`}>
                  <TrendingUp className={`w-3.5 h-3.5 ${!isPositive && 'rotate-180'}`} />
                  <span>
                    {isPositive ? '+' : ''}{rec.adjustment}%
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                    title="Apply"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    className="w-8 h-8 flex items-center justify-center bg-neutral-100 text-neutral-500 rounded-lg hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {settings?.autoRate ? (
              <>
                <div className="w-2 h-2 rounded-full bg-sage-500 animate-pulse" />
                <span className="text-[13px] text-sage-700 font-medium">Auto-optimization enabled</span>
              </>
            ) : (
              <span className="text-[13px] text-neutral-500">Review and apply recommended rates</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              Dismiss All
            </Button>
            <Button variant="primary" size="sm">
              Apply All
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
