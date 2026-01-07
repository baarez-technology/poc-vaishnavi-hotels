import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SentimentSummary({ metrics }) {
  const kpis = useMemo(() => [
    {
      id: 'overall',
      label: 'Overall Sentiment',
      value: metrics.overallSentiment,
      suffix: '/100',
      change: null,
      trend: null
    },
    {
      id: 'positive',
      label: 'Positive',
      value: metrics.positivePercent,
      suffix: '%',
      change: 2.3,
      trend: 'up'
    },
    {
      id: 'negative',
      label: 'Negative',
      value: metrics.negativePercent,
      suffix: '%',
      change: -1.2,
      trend: 'down'
    },
    {
      id: 'neutral',
      label: 'Neutral',
      value: metrics.neutralPercent,
      suffix: '%',
      change: 0,
      trend: 'stable'
    },
    {
      id: 'ota',
      label: 'OTA Rating',
      value: metrics.avgOTARating,
      suffix: '/5',
      change: 0.1,
      trend: 'up'
    },
    {
      id: 'new',
      label: 'New Today',
      value: metrics.newReviewsToday,
      suffix: '',
      change: null,
      trend: null
    },
    {
      id: 'trend',
      label: '7-Day Trend',
      value: metrics.reviewVolumeTrend > 0 ? `+${metrics.reviewVolumeTrend}` : metrics.reviewVolumeTrend,
      suffix: '',
      change: null,
      trend: metrics.reviewVolumeTrend >= 0 ? 'up' : 'down'
    }
  ], [metrics]);

  const TrendIcon = ({ trend }: { trend: string | null }) => {
    if (trend === 'up') return <TrendingUp className="w-3.5 h-3.5 text-sage-600" />;
    if (trend === 'down') return <TrendingDown className="w-3.5 h-3.5 text-gold-600" />;
    return <Minus className="w-3.5 h-3.5 text-neutral-400" />;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.id}
          className="bg-white rounded-[10px] p-5"
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-2">
            {kpi.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-[28px] font-semibold tracking-tight text-neutral-900">
              {kpi.value}
            </span>
            {kpi.suffix && (
              <span className="text-[13px] text-neutral-400">{kpi.suffix}</span>
            )}
          </div>
          {kpi.change !== null && (
            <div className="flex items-center gap-1.5 mt-2">
              <TrendIcon trend={kpi.trend} />
              <span className={`text-[12px] font-medium ${kpi.change >= 0 ? 'text-sage-600' : 'text-gold-600'}`}>
                {kpi.change >= 0 ? '+' : ''}{kpi.change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
