import { Building2, Users, Sparkles, Eye, Bed, UsersRound, DollarSign } from 'lucide-react';

export default function RoomCard({ room, onClick }) {
  // Status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      available: 'bg-[#4E5840]/10 text-[#4E5840] border-[#4E5840]/30',
      occupied: 'bg-[#A57865]/10 text-[#A57865] border-[#A57865]/30',
      dirty: 'bg-orange-50 text-orange-700 border-orange-200',
      out_of_service: 'bg-red-50 text-red-700 border-red-200'
    };

    const labels = {
      available: 'Available',
      occupied: 'Occupied',
      dirty: 'Dirty',
      out_of_service: 'Out of Service'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Cleaning badge styling
  const getCleaningBadge = (cleaning) => {
    if (cleaning === 'clean') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Clean
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
          Needs Cleaning
        </span>
      );
    }
  };

  // Room type color and background
  const getTypeStyle = (type) => {
    const styles = {
      'Standard': { text: 'text-neutral-700', bg: 'bg-neutral-50', border: 'border-neutral-200' },
      'Premium': { text: 'text-[#A57865]', bg: 'bg-[#A57865]/5', border: 'border-[#A57865]/20' },
      'Deluxe': { text: 'text-[#8E6554]', bg: 'bg-[#8E6554]/10', border: 'border-[#8E6554]/30' },
      'Suite': { text: 'text-[#CDB261]', bg: 'bg-[#CDB261]/10', border: 'border-[#CDB261]/30' }
    };
    return styles[type] || styles['Standard'];
  };

  const typeStyle = getTypeStyle(room.type);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg hover:border-[#A57865]/30 transition-all duration-200 group flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#A57865]/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#A57865]" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-neutral-900">
                {room.roomNumber}
              </h3>
            </div>
          </div>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${typeStyle.bg} ${typeStyle.text} ${typeStyle.border}`}>
            {room.type}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-neutral-500 mb-1">Floor</p>
          <div className="w-10 h-10 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-center">
            <p className="text-lg font-bold text-neutral-900">{room.floor}</p>
          </div>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {getStatusBadge(room.status)}
        {getCleaningBadge(room.cleaning)}
      </div>

      {/* Guest Info */}
      {room.guests && (
        <div className="flex items-center gap-3 mb-4 p-3.5 bg-[#A57865]/10 rounded-xl border border-[#A57865]/30">
          <div className="w-8 h-8 rounded-lg bg-[#A57865]/20 border border-[#A57865]/30 flex items-center justify-center">
            <Users className="w-4 h-4 text-[#A57865]" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-[#A57865] mb-0.5">Current Guest</p>
            <p className="text-sm font-semibold text-neutral-900">{room.guests.name}</p>
          </div>
        </div>
      )}

      {/* Room Details */}
      <div className="space-y-3 mb-4 p-4 bg-[#FAF8F6] rounded-xl border border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
            <Bed className="w-4 h-4 text-[#A57865]" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">Bed Type</span>
            <span className="text-sm font-semibold text-neutral-900">{room.bedType}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
            <UsersRound className="w-4 h-4 text-[#A57865]" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">Capacity</span>
            <span className="text-sm font-semibold text-neutral-900">{room.capacity} guests</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-4 h-4 text-[#4E5840]" />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-600">Price</span>
            <span className="text-sm font-bold text-[#4E5840]">${room.price}/night</span>
          </div>
        </div>
      </div>

      {/* Blocked Info */}
      {room.status === 'out_of_service' && room.blockedReason && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
          <p className="text-xs font-bold text-red-900 mb-2 uppercase tracking-wider">Blocked</p>
          <p className="text-sm text-red-700 mb-1">{room.blockedReason}</p>
          {room.blockedUntil && (
            <p className="text-xs text-red-600 font-medium mt-2">Until: {room.blockedUntil}</p>
          )}
        </div>
      )}

      {/* Spacer to push button to bottom */}
      <div className="flex-1"></div>

      {/* View Details Button */}
      <button
        onClick={() => onClick(room)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#A57865] hover:bg-[#8E6554] text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md group-hover:scale-[1.02] active:scale-95"
      >
        <Eye className="w-4 h-4" />
        View Details
      </button>
    </div>
  );
}
