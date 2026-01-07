import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';

const getDemandColor = (demand) => {
  if (demand >= 0.8) return { bg: 'bg-rose-100', text: 'text-rose-800', label: 'High', borderColor: 'border-rose-200' };
  if (demand >= 0.5) return { bg: 'bg-gold-50', text: 'text-gold-800', label: 'Medium', borderColor: 'border-gold-200' };
  return { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Low', borderColor: 'border-neutral-200' };
};

const getDemandIcon = (demand) => {
  if (demand >= 0.8) return TrendingUp;
  if (demand >= 0.5) return Minus;
  return TrendingDown;
};

export default function UpcomingDemand({ data }) {
  const next7Days = useMemo(() => {
    return data.slice(0, 7);
  }, [data]);

  const avgDemand = useMemo(() => {
    return next7Days.reduce((sum, day) => sum + day.demand, 0) / next7Days.length;
  }, [next7Days]);

  const highDemandDays = useMemo(() => {
    return next7Days.filter(d => d.demand >= 0.8).length;
  }, [next7Days]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">Upcoming Demand</h3>
          <p className="text-[11px] text-neutral-400 font-medium mt-0.5">Next 7 days forecast</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[11px] text-neutral-400 font-medium">Avg Demand</p>
            <p className="text-lg font-bold text-neutral-900">{Math.round(avgDemand * 100)}%</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-neutral-400 font-medium">High Days</p>
            <p className="text-lg font-bold text-rose-600">{highDemandDays}</p>
          </div>
        </div>
      </div>

      {/* Demand Heatmap */}
      <div className="grid grid-cols-7 gap-2">
        {next7Days.map((day, index) => {
          const { bg, text, label, borderColor } = getDemandColor(day.demand);
          const Icon = getDemandIcon(day.demand);
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <div
              key={index}
              className={`rounded-lg p-3 text-center transition-all hover:scale-[1.02] cursor-default border ${bg} ${borderColor}`}
            >
              <p className={`text-[10px] font-medium ${text} opacity-75`}>
                {dayName}
              </p>
              <p className={`text-xl font-bold my-0.5 ${text}`}>
                {dayNum}
              </p>
              <div className="flex items-center justify-center gap-1 mb-1">
                <Icon className={`w-3 h-3 ${text}`} />
                <p className={`text-[13px] font-semibold ${text}`}>
                  {Math.round(day.demand * 100)}%
                </p>
              </div>
              <p className={`text-[10px] font-medium ${text}`}>
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-rose-200" />
          <span className="text-[11px] text-neutral-600 font-medium">High ({'>'}80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-gold-200" />
          <span className="text-[11px] text-neutral-600 font-medium">Medium (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-neutral-200" />
          <span className="text-[11px] text-neutral-600 font-medium">Low ({'<'}50%)</span>
        </div>
      </div>

      {/* AI Insight */}
      <div className="mt-4 p-4 rounded-lg bg-terra-50 border border-terra-100">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded bg-terra-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-3.5 h-3.5 text-terra-600" />
          </div>
          <p className="text-[13px] text-terra-800 leading-relaxed">
            <span className="font-semibold">AI Insight:</span>
            {' '}
            {highDemandDays >= 4 ? (
              <>Strong demand expected this week. Consider increasing rates by 10-15% for peak days.</>
            ) : highDemandDays >= 2 ? (
              <>Moderate demand expected. Maintain current rates and monitor competitor pricing.</>
            ) : (
              <>Lower demand period. Consider promotional rates to boost occupancy.</>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
