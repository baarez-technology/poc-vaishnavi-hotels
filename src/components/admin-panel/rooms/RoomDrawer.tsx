import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, Users, Sparkles, Ban, Edit, UserPlus, Trash2, Check, AlertTriangle, Bed, UsersRound, DollarSign } from 'lucide-react';

export default function RoomDrawer({ room, isOpen, onClose, onUpdateStatus, onAssignGuest, onMarkClean, onMarkDirty, onBlockRoom, onUnassignGuest, onUnblockRoom }) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };

    // Store current scroll positions
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const mainContent = document.querySelector('main');

    // Prevent body scrolling
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = `-${scrollX}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    // Prevent scrolling on main content
    if (mainContent) {
      mainContent.style.overflow = 'hidden';
    }

    document.addEventListener('keydown', handleEsc);

    return () => {
      // Restore body scrolling
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.overflow = '';

      // Restore main content scrolling
      if (mainContent) {
        mainContent.style.overflow = '';
      }

      // Restore scroll position
      window.scrollTo(scrollX, scrollY);

      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !room) return null;

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

  const drawerContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 bottom-0 right-0 h-screen w-full max-w-md bg-white shadow-xl border-l border-neutral-200 z-50 overflow-y-auto custom-scrollbar animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 z-10">
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h2 className="text-2xl font-serif font-bold text-neutral-900">
                  Room {room.roomNumber}
                </h2>
                <p className="text-sm text-neutral-500 mt-1">{room.type} • Floor {room.floor}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-all duration-150 active:scale-95"
              >
                <X className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-2">
              {getStatusBadge(room.status)}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                room.cleaning === 'clean'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                <Sparkles className="w-3.5 h-3.5" />
                {room.cleaning === 'clean' ? 'Clean' : 'Needs Cleaning'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Guest Info */}
          {room.guests && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-[#A57865] rounded-full"></div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Current Guest
                </h3>
              </div>
              <div className="flex items-center gap-3 p-3.5 bg-[#A57865]/10 rounded-xl border border-[#A57865]/30">
                <div className="w-8 h-8 rounded-lg bg-[#A57865]/20 border border-[#A57865]/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-[#A57865]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-[#A57865] mb-0.5">Guest Name</p>
                  <p className="text-sm font-semibold text-neutral-900">{room.guests.name}</p>
                </div>
              </div>
            </section>
          )}

          {/* Blocked Info */}
          {room.status === 'out_of_service' && room.blockedReason && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-red-600 rounded-full"></div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Blocked Information
                </h3>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                <p className="text-xs font-bold text-red-900 mb-2 uppercase tracking-wider">Reason</p>
                <p className="text-sm text-red-700 mb-1">{room.blockedReason}</p>
                {room.blockedUntil && (
                  <p className="text-xs text-red-600 font-medium mt-2">Until: {room.blockedUntil}</p>
                )}
              </div>
            </section>
          )}

          {/* Room Details */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#A57865] rounded-full"></div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Room Details
              </h3>
            </div>
            <div className="space-y-3 bg-[#FAF8F6] rounded-xl p-4 border border-neutral-100">
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
          </section>

          {/* Amenities */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#A57865] rounded-full"></div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Amenities
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium text-neutral-700 hover:border-[#A57865]/30 transition-all duration-150"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-3 pt-6 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 bg-[#A57865] rounded-full"></div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Actions
              </h3>
            </div>
            <div className="space-y-2">
              {/* Update Status */}
              <button
                onClick={() => onUpdateStatus(room)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#A57865] text-white rounded-xl hover:bg-[#8E6554] hover:shadow-md hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
              >
                <Edit className="w-4 h-4" />
                Update Status
              </button>

              {/* Assign Guest (only if available) */}
              {room.status === 'available' && (
                <button
                  onClick={() => onAssignGuest(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:border-[#A57865]/30 hover:bg-neutral-50 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  Assign Guest
                </button>
              )}

              {/* Unassign Guest (only if occupied) */}
              {room.status === 'occupied' && (
                <button
                  onClick={() => onUnassignGuest(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:border-orange-300 hover:bg-orange-50 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                  Unassign Guest
                </button>
              )}

              {/* Mark Clean/Dirty */}
              {room.cleaning === 'dirty' ? (
                <button
                  onClick={() => onMarkClean(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Mark as Clean
                </button>
              ) : (
                <button
                  onClick={() => onMarkDirty(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:border-amber-300 hover:bg-amber-50 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Mark as Dirty
                </button>
              )}

              {/* Block/Unblock Room */}
              {room.status === 'out_of_service' ? (
                <button
                  onClick={() => onUnblockRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-xl hover:border-[#4E5840]/30 hover:bg-[#4E5840]/5 hover:shadow-sm hover:scale-[1.02] transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Unblock Room
                </button>
              ) : (
                <button
                  onClick={() => onBlockRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 hover:shadow-md border-2 border-red-200 hover:border-red-300 transition-all duration-200 font-semibold text-sm active:scale-95"
                >
                  <Ban className="w-4 h-4" />
                  Block Room
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );

  return createPortal(drawerContent, document.body);
}
