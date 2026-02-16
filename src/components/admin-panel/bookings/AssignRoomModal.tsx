import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Check } from 'lucide-react';
import { roomsService } from '@/api/services/rooms.service';
import { Button } from '../../ui2/Button';

const statusBadge = {
  available: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  clean: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  inspected: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  dirty: 'bg-[#CDB261]/20 text-[#CDB261] border border-[#CDB261]/30',
  occupied: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  maintenance: 'bg-red-50 text-red-600 border border-red-100',
};

export default function AssignRoomModal({
  isOpen,
  booking,
  onClose,
  onAssign,
  isAssigning,
}) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomsData, setRoomsData] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Fetch rooms from API when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRoom(null);
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      // Pass booking dates to filter rooms available for the stay period
      const searchParams: any = {};
      if (booking?.checkIn) searchParams.checkIn = booking.checkIn;
      if (booking?.checkOut) searchParams.checkOut = booking.checkOut;
      if (booking?.roomType) searchParams.type = booking.roomType;

      const rooms = await roomsService.getRooms(searchParams);
      // Handle both array and items wrapper
      const roomsArray = Array.isArray(rooms) ? rooms : (rooms?.items || []);

      // Transform and filter available rooms
      const assignableStatuses = ['available', 'clean', 'inspected', 'dirty'];
      const bookingRoomType = (booking?.roomType || '').toLowerCase();
      const transformedRooms = roomsArray
        .map((room: any) => ({
          id: room.id,
          roomNumber: room.number || room.roomNumber || String(room.id),
          type: room.category || room.name?.split(' ').slice(0, -1).join(' ') || 'Standard',
          floor: room.floor || 1,
          status: (room.status || 'available').toLowerCase(),
          price: room.price || 0,
          maxOccupancy: room.maxGuests || 2,
        }))
        .filter(room => assignableStatuses.includes(room.status))
        .filter(room => !bookingRoomType || room.type.toLowerCase().includes(bookingRoomType) || bookingRoomType.includes(room.type.toLowerCase()));

      setRoomsData(transformedRooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      setRoomsData([]);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const handleAssign = () => {
    if (!selectedRoom) return;
    onAssign({
      id: selectedRoom.id,
      roomNumber: selectedRoom.roomNumber,
      number: selectedRoom.roomNumber,
      type: selectedRoom.type,
      floor: selectedRoom.floor,
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Available',
      clean: 'Clean',
      inspected: 'Inspected',
      dirty: 'Needs Cleaning',
      occupied: 'Occupied',
      maintenance: 'Maintenance',
    };
    return labels[status] || status;
  };

  // CRITICAL FIX: Increased z-index to prevent overlap with BookingDrawer (z-50)
  // Backdrop needs to be above drawer, and modal content above backdrop
  return createPortal(
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
        onClick={onClose}
      />
      <div className="fixed inset-0 flex items-center justify-center px-4 z-[80]">
        <div
          className="bg-white rounded-xl p-6 shadow-xl max-w-3xl w-full"
          role="dialog"
          aria-modal="true"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-serif font-semibold text-neutral-900">
                Assign Room
              </h2>
              <p className="text-sm text-neutral-500">
                Pick a room for {booking.guest}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <div className="text-sm text-neutral-600">
              Booking ID <span className="font-semibold text-neutral-900">{booking.id}</span>
            </div>
            <div className="text-sm text-neutral-600">
              Stay <span className="font-semibold text-neutral-900">{booking.checkIn}</span> -
              <span className="font-semibold text-neutral-900 ml-1">{booking.checkOut}</span>
            </div>
          </div>

          <div className="grid gap-3 max-h-[420px] overflow-y-auto pr-1">
            {isLoadingRooms ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#A57865] animate-spin mb-3" />
                <p className="text-sm text-neutral-500">Loading available rooms...</p>
              </div>
            ) : roomsData.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500">No available rooms found</p>
              </div>
            ) : (
              roomsData.map((room) => {
                const isSelected = selectedRoom?.roomNumber === room.roomNumber;
                return (
                  <button
                    key={room.roomNumber}
                    type="button"
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full text-left bg-white border rounded-xl p-4 shadow-sm transition ${
                      isSelected
                        ? 'border-[#A57865] bg-[#A57865]/5'
                        : 'border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-neutral-900">
                          Room {room.roomNumber}
                        </p>
                        <p className="text-sm text-neutral-500">
                          {room.type} • Floor {room.floor}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadge[room.status] || statusBadge.available}`}
                      >
                        {getStatusLabel(room.status)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAssign} disabled={!selectedRoom || isAssigning} icon={Check} loading={isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign Room'}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
