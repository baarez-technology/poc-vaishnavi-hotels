/**
 * AssignRoomModal Component
 * Assign room to booking - Glimmora Design System v5.0
 * Side drawer following CMS pattern
 */

import { useState, useMemo, useEffect } from 'react';
import { Check, Bed, Users, Loader2 } from 'lucide-react';
import { roomsService } from '../../api/services/rooms.service';
import { formatCurrency } from '../../utils/bookings';
import { Drawer } from '../ui2/Drawer';
import { Button } from '../ui2/Button';

// Custom Select Component matching CMS pattern
function CustomSelect({ value, onChange, options, placeholder = 'Select...' }) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all duration-150 text-left flex items-center justify-between focus:outline-none ${
          isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={selectedOption ? 'text-neutral-900' : 'text-neutral-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <svg className={`w-4 h-4 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white rounded-lg border border-neutral-200 shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors ${
                  value === option.value ? 'bg-terra-50 text-terra-700' : 'text-neutral-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AssignRoomModal({ isOpen, onClose, onAssign, booking, isAssigning, bookings = [] }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch rooms when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRoom(null);
      setSearchQuery('');
      setFilterType('all');
      setFilterFloor('all');
      setError(null);
      fetchRooms();
    }
  }, [isOpen]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      const fetchedRooms = await roomsService.getRooms();
      setRooms(fetchedRooms);
    } catch (err: any) {
      console.error('[AssignRoomModal] Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to check if room is available
  const isRoomAvailable = (room: any) => {
    const status = (room.status || '').toLowerCase();
    return ['available', 'clean', 'inspected'].includes(status);
  };

  // Get available rooms
  const availableRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];

    return rooms.filter(room => {
      if (!isRoomAvailable(room)) return false;

      if (booking?.checkIn && booking?.checkOut && bookings.length > 0) {
        const roomNumber = room.number || room.roomNumber;
        const hasConflict = bookings.some(b =>
          b.room === roomNumber &&
          b.status !== 'CANCELLED' &&
          b.status !== 'CHECKED-OUT' &&
          new Date(b.checkIn) < new Date(booking.checkOut) &&
          new Date(b.checkOut) > new Date(booking.checkIn)
        );
        if (hasConflict) return false;
      }

      return true;
    });
  }, [rooms, booking, bookings]);

  // Filter and search rooms
  const filteredRooms = useMemo(() => {
    let filtered = [...availableRooms];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(room => {
        const roomNumber = room.number || room.roomNumber || '';
        const roomType = room.room_type?.name || room.type || '';
        return roomNumber.toLowerCase().includes(query) ||
               roomType.toLowerCase().includes(query);
      });
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(room => {
        const roomType = room.room_type?.name || room.type || '';
        return roomType === filterType;
      });
    }

    if (filterFloor !== 'all') {
      filtered = filtered.filter(room => room.floor === parseInt(filterFloor));
    }

    const bookingType = booking?.roomType || '';
    filtered.sort((a, b) => {
      const aType = a.room_type?.name || a.type || '';
      const bType = b.room_type?.name || b.type || '';
      if (aType === bookingType && bType !== bookingType) return -1;
      if (bType === bookingType && aType !== bookingType) return 1;
      const aNum = a.number || a.roomNumber || '';
      const bNum = b.number || b.roomNumber || '';
      return aNum.localeCompare(bNum);
    });

    return filtered;
  }, [availableRooms, searchQuery, filterType, filterFloor, booking?.roomType]);

  // Get unique room types
  const roomTypes = useMemo(() => {
    const types = new Set(availableRooms.map(r => r.room_type?.name || r.type));
    return Array.from(types).filter(Boolean).sort();
  }, [availableRooms]);

  // Get unique floors
  const floors = useMemo(() => {
    const floorSet = new Set(availableRooms.map(r => r.floor).filter(f => f != null));
    return Array.from(floorSet).sort((a, b) => a - b);
  }, [availableRooms]);

  const handleSubmit = () => {
    if (selectedRoom) {
      const roomNumber = selectedRoom.number || selectedRoom.roomNumber;
      const roomType = selectedRoom.room_type?.name || selectedRoom.type || 'Standard';
      onAssign({
        id: selectedRoom.id,
        roomNumber: roomNumber,
        type: roomType,
        floor: selectedRoom.floor,
        price: selectedRoom.room_type?.base_price || selectedRoom.price,
      });
      setSelectedRoom(null);
    }
  };

  const drawerFooter = (
    <div className="flex items-center justify-end gap-3 w-full">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={!selectedRoom}
        loading={isAssigning}
      >
        Assign Room
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Room"
      subtitle="Select an available room for this booking"
      maxWidth="max-w-2xl"
      footer={drawerFooter}
    >
      <div className="space-y-6">
        {/* Booking Info */}
        {booking && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Booking Details
            </h3>
            <div className="p-4 bg-terra-50 rounded-lg border border-terra-100">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Guest</span>
                  <span className="text-[13px] font-semibold text-neutral-900">{booking.guest}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Booking ID</span>
                  <span className="text-[13px] font-mono text-neutral-700">{booking.id}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Check-in</span>
                  <span className="text-[13px] text-neutral-700">{booking.checkIn}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-neutral-500 block">Check-out</span>
                  <span className="text-[13px] text-neutral-700">{booking.checkOut}</span>
                </div>
                {booking.roomType && (
                  <div className="col-span-2 pt-2 border-t border-terra-100">
                    <span className="text-[11px] font-medium text-neutral-500 block">Requested Type</span>
                    <span className="text-[13px] font-semibold text-terra-600">{booking.roomType}</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Search and Filters */}
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
            Search & Filter
          </h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search by room number or type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all duration-150"
              />
            </div>

            <div className="flex gap-3">
              <CustomSelect
                value={filterType}
                onChange={setFilterType}
                options={[
                  { value: 'all', label: 'All Types' },
                  ...roomTypes.map(type => ({ value: type, label: type }))
                ]}
                placeholder="All Types"
              />
              <CustomSelect
                value={filterFloor}
                onChange={setFilterFloor}
                options={[
                  { value: 'all', label: 'All Floors' },
                  ...floors.map(floor => ({ value: String(floor), label: `Floor ${floor}` }))
                ]}
                placeholder="All Floors"
              />
            </div>
          </div>
        </section>

        {/* Available Rooms */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400">
              Available Rooms
            </h3>
            <span className="text-[11px] text-neutral-500">{filteredRooms.length} rooms</span>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-terra-500" />
              <span className="ml-3 text-[13px] text-neutral-600">Loading rooms...</span>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-[13px] text-rose-700 mb-4">
              {error}
              <button onClick={fetchRooms} className="ml-2 underline hover:no-underline">Retry</button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredRooms.length === 0 && (
            <div className="text-center py-8">
              <Bed className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <p className="text-[13px] text-neutral-500">No rooms available</p>
              <p className="text-[11px] text-neutral-400 mt-1">Try adjusting your filters</p>
            </div>
          )}

          {/* Rooms List */}
          {!isLoading && !error && filteredRooms.length > 0 && (
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {filteredRooms.map((room) => {
                const roomNumber = room.number || room.roomNumber || 'N/A';
                const roomType = room.room_type?.name || room.type || 'Standard';
                const roomFloor = room.floor || Math.floor(parseInt(roomNumber) / 100);
                const roomPrice = room.room_type?.base_price || room.price || 0;
                const isSelected = selectedRoom?.id === room.id;
                const isMatchingType = roomType === booking?.roomType;

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-terra-500 bg-terra-50'
                        : isMatchingType
                        ? 'border-emerald-300 bg-emerald-50/30 hover:border-terra-400'
                        : 'border-neutral-200 hover:border-terra-400 hover:bg-neutral-50 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-terra-500 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          <span className="font-bold text-base leading-tight">{roomNumber}</span>
                          <span className="text-[9px] opacity-70">F{roomFloor}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-[13px] text-neutral-900">
                            {roomType}
                            {isMatchingType && (
                              <span className="ml-2 text-[11px] text-emerald-600 font-normal">Match</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                              <Users className="w-3 h-3" />
                              <span>{room.capacity || room.max_occupancy || 2}</span>
                            </div>
                            {roomPrice > 0 && (
                              <>
                                <span className="text-neutral-300">|</span>
                                <span className="text-[11px] font-medium text-terra-600">
                                  {formatCurrency(roomPrice)}/night
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-terra-500">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Selected Room Summary */}
        {selectedRoom && (
          <div className="p-3 bg-terra-50 border border-terra-200 rounded-lg">
            <p className="text-[13px] text-neutral-700">
              <span className="font-medium">Selected:</span>{' '}
              Room {selectedRoom.number || selectedRoom.roomNumber} - {selectedRoom.room_type?.name || selectedRoom.type}
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
