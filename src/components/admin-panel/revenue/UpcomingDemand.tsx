import { useMemo } from 'react';
import { Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const getDemandColor = (demand) => {
  if (demand >= 0.8) return { bg: '#A57865', text: 'white', label: 'High' };
  if (demand >= 0.5) return { bg: '#C8B29D', text: '#1A1A1A', label: 'Medium' };
  return { bg: '#E5E5E5', text: '#6B7280', label: 'Low' };
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
    <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#A57865]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[#A57865]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-neutral-900">Upcoming Demand</h3>
            <p className="text-sm text-neutral-500">Next 7 days forecast</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-neutral-500">Avg Demand</p>
            <p className="text-lg font-bold text-neutral-900">{Math.round(avgDemand * 100)}%</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-neutral-500">High Demand Days</p>
            <p className="text-lg font-bold text-[#A57865]">{highDemandDays}</p>
          </div>
        </div>
      </div>

      {/* Demand Heatmap */}
      <div className="grid grid-cols-7 gap-3">
        {next7Days.map((day, index) => {
          const { bg, text, label } = getDemandColor(day.demand);
          const Icon = getDemandIcon(day.demand);
          const date = new Date(day.date);
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          const dayNum = date.getDate();

          return (
            <div
              key={index}
              className="rounded-xl p-4 text-center transition-transform hover:scale-105 cursor-default"
              style={{ backgroundColor: bg }}
            >
              <p className="text-xs font-medium opacity-75" style={{ color: text }}>
                {dayName}
              </p>
              <p className="text-2xl font-bold my-1" style={{ color: text }}>
                {dayNum}
              </p>
              <div className="flex items-center justify-center gap-1 mb-2">
                <Icon className="w-3 h-3" style={{ color: text }} />
                <p className="text-sm font-semibold" style={{ color: text }}>
                  {Math.round(day.demand * 100)}%
                </p>
              </div>
              <p className="text-xs font-medium" style={{ color: text }}>
                {label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#A57865]" />
          <span className="text-xs text-neutral-600">High ({'>'}80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#C8B29D]" />
          <span className="text-xs text-neutral-600">Medium (50-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#E5E5E5]" />
          <span className="text-xs text-neutral-600">Low ({'<'}50%)</span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 p-4 bg-[#FAF7F4] rounded-xl">
        <p className="text-sm text-neutral-700">
          <span className="font-semibold text-[#A57865]">AI Insight:</span>
          {' '}
          {highDemandDays >= 4 ? (
            <>
              Strong demand expected this week. Consider increasing rates by 10-15% for peak days.
            </>
          ) : highDemandDays >= 2 ? (
            <>
              Moderate demand expected. Maintain current rates and monitor competitor pricing.
            </>
          ) : (
            <>
              Lower demand period. Consider promotional rates to boost occupancy.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
