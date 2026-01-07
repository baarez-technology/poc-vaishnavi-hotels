import { useMemo } from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const getSentimentStyle = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return {
        bg: 'bg-[#4E5840]/15',
        text: 'text-[#4E5840]',
        icon: ThumbsUp,
        label: '+'
      };
    case 'negative':
      return {
        bg: 'bg-[#CDB261]/20',
        text: 'text-[#CDB261]',
        icon: ThumbsDown,
        label: '-'
      };
    default:
      return {
        bg: 'bg-[#C8B29D]/20',
        text: 'text-[#C8B29D]',
        icon: Minus,
        label: '~'
      };
  }
};

export default function KeywordFrequency({ data }) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => b.mentions - a.mentions);
  }, [data]);

  const maxMentions = useMemo(() => {
    return Math.max(...data.map(k => k.mentions));
  }, [data]);

  const stats = useMemo(() => {
    const positive = data.filter(k => k.sentiment === 'positive');
    const negative = data.filter(k => k.sentiment === 'negative');
    const neutral = data.filter(k => k.sentiment === 'neutral');

    return {
      positive: positive.reduce((sum, k) => sum + k.mentions, 0),
      negative: negative.reduce((sum, k) => sum + k.mentions, 0),
      neutral: neutral.reduce((sum, k) => sum + k.mentions, 0),
      total: data.reduce((sum, k) => sum + k.mentions, 0)
    };
  }, [data]);

  return (
    <div className="bg-white rounded-[10px] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900">Keyword Analysis</h3>
          <p className="text-[13px] text-neutral-500 mt-0.5">AI-detected topics from reviews</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-[#4E5840]/15 text-[#4E5840] text-xs font-semibold rounded-full">
            {stats.positive} positive
          </span>
          <span className="px-2 py-1 bg-[#CDB261]/20 text-[#CDB261] text-xs font-semibold rounded-full">
            {stats.negative} negative
          </span>
        </div>
      </div>

      {/* Keyword List with Bars */}
      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
        {sortedData.map((keyword, index) => {
          const style = getSentimentStyle(keyword.sentiment);
          const barWidth = (keyword.mentions / maxMentions) * 100;
          const Icon = style.icon;

          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${style.bg} ${style.text}`}>
                    {style.label}
                  </span>
                  <span className="text-sm font-medium text-neutral-900 capitalize">
                    {keyword.keyword}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon className={`w-3 h-3 ${style.text}`} />
                  <span className="text-sm font-bold text-neutral-700">
                    {keyword.mentions}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    keyword.sentiment === 'positive'
                      ? 'bg-[#4E5840]'
                      : keyword.sentiment === 'negative'
                      ? 'bg-[#CDB261]'
                      : 'bg-[#C8B29D]'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-5 border-t border-neutral-100">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ThumbsUp className="w-4 h-4 text-sage-600" />
              <span className="text-[20px] font-semibold tracking-tight text-sage-600">
                {Math.round((stats.positive / stats.total) * 100)}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Positive</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Minus className="w-4 h-4 text-neutral-400" />
              <span className="text-[20px] font-semibold tracking-tight text-neutral-500">
                {Math.round((stats.neutral / stats.total) * 100)}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Neutral</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <ThumbsDown className="w-4 h-4 text-gold-600" />
              <span className="text-[20px] font-semibold tracking-tight text-gold-600">
                {Math.round((stats.negative / stats.total) * 100)}%
              </span>
            </div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Negative</p>
          </div>
        </div>
      </div>

      {/* AI Insight */}
      <div className="mt-4 p-4 bg-ocean-50 rounded-[8px]">
        <p className="text-[12px] text-neutral-700 leading-relaxed">
          <span className="font-semibold text-ocean-600">AI Insight:</span>
          {' '}
          {stats.positive > stats.negative
            ? `"${sortedData[0]?.keyword}" is your most mentioned topic. Focus on maintaining this strength while addressing "${sortedData.find(k => k.sentiment === 'negative')?.keyword || 'minor concerns'}".`
            : `Address "${sortedData.find(k => k.sentiment === 'negative')?.keyword}" as a priority - it's frequently mentioned in negative reviews.`
          }
        </p>
      </div>
    </div>
  );
}
