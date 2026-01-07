import { Users, TrendingUp, RefreshCw, Eye, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../utils/crm';

export default function SegmentCard({ segment, onClick }) {
  const filters = segment.filters || {};
  const filterBadges = Object.entries(filters)
    .filter(([, value]) => value && value !== 'all')
    .map(([key, value]) => {
      let label = '';
      switch (key) {
        case 'loyaltyTier':
          label = `Tier: ${value}`;
          break;
        case 'minStays':
          label = `≥${value} stays`;
          break;
        case 'maxStays':
          label = `≤${value} stays`;
          break;
        case 'bookingSource':
          label = `Source: ${value}`;
          break;
        case 'minSpend':
          label = `≥${formatCurrency(value)}`;
          break;
        case 'maxSpend':
          label = `≤${formatCurrency(value)}`;
          break;
        case 'lastStayDays':
          label = `Last ${value} days`;
          break;
        case 'country':
          label = `Country: ${value}`;
          break;
        case 'roomType':
          label = `Room: ${value}`;
          break;
        case 'tags':
          label = Array.isArray(value) ? value.join(', ') : value;
          break;
        default:
          label = `${key}: ${value}`;
      }
      return { key, label };
    });

  const segmentColor = segment.color || '#A57865';

  return (
    <div
      className="bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-xl hover:border-neutral-300 transition-all duration-300 cursor-pointer group p-5"
      onClick={() => onClick(segment)}
    >
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{ backgroundColor: `${segmentColor}15` }}
          >
            <Users
              className="w-7 h-7"
              style={{ color: segmentColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-bold text-neutral-900 group-hover:text-[#A57865] transition-colors truncate"
              style={{ color: segment.color ? segmentColor : undefined }}
            >
              {segment.name}
            </h3>
            <p className="text-sm text-neutral-500 line-clamp-2 mt-0.5">{segment.description}</p>
          </div>
        </div>

        {/* Filter Badges */}
        {filterBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {filterBadges.slice(0, 3).map(({ key, label }) => (
              <span
                key={key}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200"
              >
                {label}
              </span>
            ))}
            {filterBadges.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-neutral-500">
                +{filterBadges.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="bg-neutral-50 rounded-xl p-4 mb-4 border border-neutral-100">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-[#A57865]/10 flex items-center justify-center mx-auto mb-2">
                <Users className="w-4 h-4 text-[#A57865]" />
              </div>
              <p className="text-xl font-bold text-neutral-900">{segment.guestCount || 0}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Guests</p>
            </div>
            <div className="text-center border-x border-neutral-200">
              <div className="w-8 h-8 rounded-lg bg-[#4E5840]/10 flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-[#4E5840]" />
              </div>
              <p className="text-xl font-bold text-neutral-900">{formatCurrency(segment.avgRevenue || 0)}</p>
              <p className="text-xs text-neutral-500 mt-0.5">Avg Revenue</p>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 rounded-lg bg-[#5C9BA4]/10 flex items-center justify-center mx-auto mb-2">
                <RefreshCw className="w-4 h-4 text-[#5C9BA4]" />
              </div>
              <p className="text-xl font-bold text-neutral-900">{segment.repeatRate || 0}%</p>
              <p className="text-xs text-neutral-500 mt-0.5">Repeat Rate</p>
            </div>
          </div>
        </div>

      {/* View Button */}
      <button
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#A57865] text-white rounded-xl text-sm font-medium hover:bg-[#8E6554] transition-colors group/btn"
      >
        <Eye className="w-4 h-4" />
        View Segment
        <ChevronRight className="w-4 h-4 opacity-0 -ml-2 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all" />
      </button>
    </div>
  );
}
