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
    'Standard': { text: 'text-neutral-600', bg: 'bg-neutral-100', icon: 'text-neutral-400' },
    'Premium': { text: 'text-terra-600', bg: 'bg-terra-50', icon: 'text-terra-500' },
    'Deluxe': { text: 'text-terra-700', bg: 'bg-terra-100', icon: 'text-terra-600' },
    'Suite': { text: 'text-gold-700', bg: 'bg-gold-50', icon: 'text-gold-600' }
  };

  const status = statusConfig[room.status] || statusConfig.available;
  const typeStyle = typeConfig[room.type] || typeConfig['Standard'];

  return (
    <div
      onClick={() => onClick(room)}
      className="bg-white rounded-[10px] overflow-hidden cursor-pointer group"
    >
      {/* Header with Status */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            {/* Room Number */}
            <h3 className="text-[28px] font-semibold tracking-tight text-neutral-900 mb-2">
              {room.roomNumber}
            </h3>
            {/* Room Type Badge */}
            <span className={`inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg ${typeStyle.bg} ${typeStyle.text}`}>
              {room.type}
            </span>
          </div>
          {/* Floor */}
          <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${typeStyle.bg}`}>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">Floor</span>
            <span className={`text-lg font-bold ${typeStyle.text}`}>{room.floor}</span>
          </div>
        </div>

        {/* Status & Cleaning Row */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
            {status.label}
          </span>
          {room.cleaning === 'clean' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-600">
              <Sparkles className="w-3 h-3" />
              Clean
            </span>
          ) : (
            <span className="text-[11px] font-medium text-gold-600">Needs Cleaning</span>
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
