/**
 * RoomCard Component
 * Room card for grid display - Glimmora Design System v5.0
 * Matches Channel Manager card styling exactly
 */

import { Users, Sparkles, Bed, UsersRound, ChevronRight } from 'lucide-react';

export default function RoomCard({ room, onClick }) {
  // Status config with design system colors
  const statusConfig = {
    available: {
      label: 'Available',
      dot: 'bg-sage-500',
      text: 'text-sage-700',
      bg: 'bg-sage-50'
    },
    occupied: {
      label: 'Occupied',
      dot: 'bg-terra-500',
      text: 'text-terra-700',
      bg: 'bg-terra-50'
    },
    dirty: {
      label: 'Dirty',
      dot: 'bg-gold-500',
      text: 'text-gold-700',
      bg: 'bg-gold-50'
    },
    out_of_service: {
      label: 'Out of Service',
      dot: 'bg-rose-500',
      text: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  };

  // Room type config
  const typeConfig = {
    'Minimalist Studio': { text: 'text-neutral-600', bg: 'bg-neutral-100', icon: 'text-neutral-400' },
    'Coastal Retreat': { text: 'text-teal-600', bg: 'bg-teal-50', icon: 'text-teal-500' },
    'Urban Oasis': { text: 'text-sage-700', bg: 'bg-sage-50', icon: 'text-sage-600' },
    'Sunset Vista': { text: 'text-gold-700', bg: 'bg-gold-50', icon: 'text-gold-600' },
    'Pacific Suite': { text: 'text-terra-600', bg: 'bg-terra-50', icon: 'text-terra-500' },
    'Wellness Suite': { text: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'text-emerald-500' },
    'Family Sanctuary': { text: 'text-terra-700', bg: 'bg-terra-100', icon: 'text-terra-600' },
    'Oceanfront Penthouse': { text: 'text-amber-700', bg: 'bg-amber-50', icon: 'text-amber-600' }
  };

  const status = statusConfig[room.status] || statusConfig.available;
  const typeStyle = typeConfig[room.type] || typeConfig['Minimalist Studio'];

  // Get primary image or fallback
  const primaryImage = room.images?.[0] || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800';

  return (
    <div
      onClick={() => onClick(room)}
      className="bg-white rounded-[10px] overflow-hidden cursor-pointer group"
    >
      {/* Room Image */}
      <div className="relative h-40 overflow-hidden">
        <img
          src={primaryImage}
          alt={`Room ${room.roomNumber}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800';
          }}
        />
        {/* Status Badge Overlay */}
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
            {status.label}
          </span>
        </div>
        {/* Floor Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
            <span className="text-[10px] text-neutral-500">Floor</span>
            <span className="text-sm font-bold text-neutral-900">{room.floor}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            {/* Room Number */}
            <h3 className="text-xl font-semibold tracking-tight text-neutral-900 mb-1">
              Room {room.roomNumber}
            </h3>
            {/* Room Type Badge */}
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg ${typeStyle.bg} ${typeStyle.text}`}>
              {room.type}
            </span>
          </div>
          {/* Cleaning Status */}
          {room.cleaning === 'clean' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-600 px-2 py-1 bg-sage-50 rounded-lg">
              <Sparkles className="w-3 h-3" />
              Clean
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gold-600 px-2 py-1 bg-gold-50 rounded-lg">Needs Cleaning</span>
          )}
        </div>

        {/* Guest Info */}
        {room.guests && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-terra-50 rounded-lg">
            <div className="w-9 h-9 rounded-full bg-terra-500 flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-terra-600 font-medium">Current Guest</p>
              <p className="text-[13px] font-semibold text-neutral-900 truncate">{room.guests.name}</p>
            </div>
          </div>
        )}

        {/* Room Details Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Bed className={`w-4 h-4 ${typeStyle.icon}`} />
              <span className="text-[12px] text-neutral-500">{room.bedType}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <UsersRound className={`w-4 h-4 ${typeStyle.icon}`} />
              <span className="text-[12px] text-neutral-500">{room.capacity}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${typeStyle.text}`}>${room.price}</span>
            <span className="text-[11px] text-neutral-400">/night</span>
            <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-terra-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Blocked Info */}
        {room.status === 'out_of_service' && room.blockedReason && (
          <div className="mt-4 p-3 bg-rose-50 rounded-lg">
            <p className="text-[10px] uppercase tracking-wider text-rose-500 font-semibold mb-1">Blocked</p>
            <p className="text-[12px] text-rose-600">{room.blockedReason}</p>
            {room.blockedUntil && (
              <p className="text-[11px] text-rose-400 mt-1">Until: {room.blockedUntil}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
