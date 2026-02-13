/**
 * AssignRoomModal Component
 * Smart room assignment with AI recommendations - Glimmora Design System v5.0
 * Features: AI scoring, cleaning status, guest preferences
 */

import { useState, useMemo, useEffect } from 'react';
import { Check, Bed, Users, Loader2, Sparkles, Zap, Droplets } from 'lucide-react';
import { roomsService } from '../../api/services/rooms.service';
import { bookingService } from '../../api/services/booking.service';
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

// Cleaning status badge
function CleaningStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    clean: { color: 'bg-emerald-100 text-emerald-700', icon: Droplets, label: 'Clean' },
    inspected: { color: 'bg-emerald-100 text-emerald-700', icon: Check, label: 'Inspected' },
    dirty: { color: 'bg-amber-100 text-amber-700', icon: Droplets, label: 'Needs Cleaning' },
    available: { color: 'bg-blue-100 text-blue-700', icon: Check, label: 'Available' },
    occupied: { color: 'bg-rose-100 text-rose-700', icon: Users, label: 'Occupied' },
  };

  const config = statusConfig[status?.toLowerCase()] || statusConfig.available;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

// AI Score badge
function AIScoreBadge({ score }: { score: number }) {
  const getScoreColor = () => {
    if (score >= 130) return 'bg-emerald-500';
    if (score >= 115) return 'bg-emerald-400';
    if (score >= 100) return 'bg-blue-400';
    return 'bg-neutral-400';
  };

  return (
    <div className="flex items-center gap-1">
      <Sparkles className="w-3 h-3 text-amber-500" />
      <div className={`h-1.5 w-12 rounded-full bg-neutral-200 overflow-hidden`}>
        <div
          className={`h-full ${getScoreColor()} transition-all duration-300`}
          style={{ width: `${Math.min((score / 150) * 100, 100)}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-neutral-600">{Math.round(score)}</span>
    </div>
  );
}

export default function AssignRoomModal({ isOpen, onClose, onAssign, booking, isAssigning, bookings = [] }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterFloor, setFilterFloor] = useState('all');
  const [rooms, setRooms] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestPreferences, setGuestPreferences] = useState<Record<string, any> | null>(null);

  // Fetch rooms and recommendations when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedRoom(null);
      setSearchQuery('');
      // Default to booking's room type - only show matching rooms
      setFilterType(booking?.roomType || 'all');
      setFilterFloor('all');
      setError(null);
      setRecommendations([]);
      setGuestPreferences(null);
      fetchRooms();
      if (booking?.id) {
        fetchRecommendations();
      }
    }
  }, [isOpen, booking?.id, booking?.roomType]);

  const fetchRooms = async () => {
    setIsLoading(true);
    try {
      // Pass booking dates to filter rooms available for the stay period
      const searchParams: any = {};
      if (booking?.checkIn) searchParams.checkIn = booking.checkIn;
      if (booking?.checkOut) searchParams.checkOut = booking.checkOut;
      if (booking?.roomType) searchParams.type = booking.roomType;
      const fetchedRooms = await roomsService.getRooms(searchParams);
      setRooms(fetchedRooms);
    } catch (err: any) {
      console.error('[AssignRoomModal] Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    if (!booking?.id) return;

    setIsLoadingRecommendations(true);
    try {
      const result = await bookingService.getRoomRecommendations(booking.id, 5);
      if (result.success && result.recommendations.length > 0) {
        setRecommendations(result.recommendations);
        setGuestPreferences(result.guest_preferences);
      }
    } catch (err: any) {
      console.error('[AssignRoomModal] Error fetching recommendations:', err);
      // Non-blocking - just log the error
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  // Auto-assign best room using AI
  const handleAutoAssign = async () => {
    if (!booking?.id) return;

    setIsAutoAssigning(true);
    try {
      const result = await bookingService.smartAssignRoom(booking.id);
      if (result.success) {
        // Call onAssign with the result
        onAssign({
          id: result.room_id,
          roomNumber: result.room_number,
          type: result.room_type,
        });
      } else {
        setError('Auto-assignment failed. Please select a room manually.');
      }
    } catch (err: any) {
      console.error('[AssignRoomModal] Auto-assign error:', err);
      setError(err.response?.data?.detail || 'Auto-assignment failed. Please try again.');
    } finally {
      setIsAutoAssigning(false);
    }
  };

  // Helper to check if room is available
  const isRoomAvailable = (room: any) => {
    const status = (room.status || '').toLowerCase();
    return ['available', 'clean', 'inspected'].includes(status);
  };

  // Get available rooms with recommendation scores merged
  const availableRooms = useMemo(() => {
    if (!rooms || rooms.length === 0) return [];

    const recommendationMap = new Map(
      recommendations.map(r => [String(r.room_id), r])
    );

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
    }).map(room => {
      // Merge recommendation data if available
      const rec = recommendationMap.get(String(room.id));
      return {
        ...room,
        match_score: rec?.match_score || null,
        is_recommended: !!rec,
      };
    });
  }, [rooms, booking, bookings, recommendations]);

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
        // Case-insensitive comparison for room type matching
        return roomType.toLowerCase() === filterType.toLowerCase();
      });
    }

    if (filterFloor !== 'all') {
      filtered = filtered.filter(room => room.floor === parseInt(filterFloor));
    }

    // Sort: recommended first (by score), then by matching type, then by room number
    const bookingType = booking?.roomType || '';
    filtered.sort((a, b) => {
      // Recommended rooms first (by score descending)
      if (a.match_score && !b.match_score) return -1;
      if (!a.match_score && b.match_score) return 1;
      if (a.match_score && b.match_score) {
        return b.match_score - a.match_score;
      }

      // Then matching type
      const aType = a.room_type?.name || a.type || '';
      const bType = b.room_type?.name || b.type || '';
      if (aType === bookingType && bType !== bookingType) return -1;
      if (bType === bookingType && aType !== bookingType) return 1;

      // Then by room number
      const aNum = a.number || a.roomNumber || '';
      const bNum = b.number || b.roomNumber || '';
      return aNum.localeCompare(bNum);
    });

    return filtered;
  }, [availableRooms, searchQuery, filterType, filterFloor, booking?.roomType]);

  // Get unique room types - ensure booking's room type is always included
  const roomTypes = useMemo(() => {
    const types = new Set(availableRooms.map(r => r.room_type?.name || r.type));
    // Add booking's room type if not already in the set
    if (booking?.roomType) {
      types.add(booking.roomType);
    }
    return Array.from(types).filter(Boolean).sort();
  }, [availableRooms, booking?.roomType]);

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
    <div className="flex items-center justify-between w-full">
      <Button
        variant="outline"
        icon={Zap}
        onClick={handleAutoAssign}
        loading={isAutoAssigning}
        disabled={!booking?.id || isAssigning}
        className="text-amber-600 border-amber-300 hover:bg-amber-50"
      >
        Auto Assign Best
      </Button>
      <div className="flex items-center gap-3">
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
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Room"
      subtitle="AI-powered room matching based on guest preferences"
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

        {/* Guest Preferences (if available) */}
        {guestPreferences && Object.keys(guestPreferences).length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
              Guest Preferences (from Pre-checkin)
            </h3>
            <div className="flex flex-wrap gap-2">
              {guestPreferences.floor_preference && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[11px]">
                  Floor: {guestPreferences.floor_preference}
                </span>
              )}
              {guestPreferences.view_preference && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[11px]">
                  View: {guestPreferences.view_preference}
                </span>
              )}
              {guestPreferences.bed_type && (
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-[11px]">
                  Bed: {guestPreferences.bed_type}
                </span>
              )}
              {guestPreferences.accessible && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-[11px]">
                  Accessible
                </span>
              )}
              {guestPreferences.quiet_room && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[11px]">
                  Quiet Room
                </span>
              )}
            </div>
          </section>
        )}

        {/* AI Recommendations */}
        {recommendations.length > 0 && (
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-3">
              <Sparkles className="w-3 h-3 inline mr-1 text-amber-500" />
              AI Recommended ({recommendations.length})
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {recommendations.slice(0, 5).map((rec, idx) => {
                const isSelected = String(selectedRoom?.id) === String(rec.room_id);
                return (
                  <button
                    key={rec.room_id}
                    onClick={() => {
                      const room = rooms.find(r => String(r.id) === String(rec.room_id));
                      if (room) setSelectedRoom(room);
                    }}
                    className={`p-2 rounded-lg border-2 text-center transition-all ${
                      isSelected
                        ? 'border-terra-500 bg-terra-50'
                        : 'border-amber-200 bg-amber-50/50 hover:border-terra-400'
                    }`}
                  >
                    <div className="text-lg font-bold text-neutral-900">{rec.room_number}</div>
                    <div className="text-[10px] text-neutral-500 truncate">{rec.room_type}</div>
                    <AIScoreBadge score={rec.match_score} />
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {isLoadingRecommendations && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg text-[13px] text-amber-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading AI recommendations...
          </div>
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
                  ...roomTypes.map(type => ({
                    value: type,
                    label: type.toLowerCase() === booking?.roomType?.toLowerCase()
                      ? `${type} (Booked)`
                      : type
                  }))
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

          {/* Info banner when filtering by booked room type and rooms are available */}
          {filterType !== 'all' && filterType.toLowerCase() === booking?.roomType?.toLowerCase() && filteredRooms.length > 0 && (
            <div className="mb-4 p-3 bg-terra-50 border border-terra-200 rounded-lg">
              <p className="text-[12px] text-terra-700">
                <span className="font-medium">Showing {booking.roomType} rooms only</span>
                <span className="text-terra-500 ml-1">— matching the guest's booking</span>
              </p>
            </div>
          )}

          {/* Warning if no rooms of booked type are available */}
          {filterType !== 'all' && filteredRooms.length === 0 && filterType.toLowerCase() === booking?.roomType?.toLowerCase() && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[12px] text-amber-700">
                <span className="font-medium">No {booking.roomType} rooms available</span>
                <span className="text-amber-600 ml-1">— consider offering an upgrade</span>
              </p>
              <button
                onClick={() => setFilterType('all')}
                className="mt-2 text-[11px] font-medium text-amber-700 underline hover:no-underline"
              >
                Show all room types
              </button>
            </div>
          )}

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
                const isRecommended = room.is_recommended;

                return (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-terra-500 bg-terra-50'
                        : isRecommended
                        ? 'border-amber-300 bg-amber-50/30 hover:border-terra-400'
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
                            : isRecommended
                            ? 'bg-amber-500 text-white'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          <span className="font-bold text-base leading-tight">{roomNumber}</span>
                          <span className="text-[9px] opacity-70">F{roomFloor}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-[13px] text-neutral-900">
                              {roomType}
                            </p>
                            {isRecommended && (
                              <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                                <Sparkles className="w-3 h-3" />
                                AI Pick
                              </span>
                            )}
                            {isMatchingType && !isRecommended && (
                              <span className="text-[11px] text-emerald-600 font-normal">Match</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <CleaningStatusBadge status={room.status} />
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
                          {room.match_score && (
                            <div className="mt-1.5">
                              <AIScoreBadge score={room.match_score} />
                            </div>
                          )}
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

        {/* Room Type Mismatch Warning */}
        {selectedRoom && (() => {
          const selectedType = (selectedRoom.room_type?.name || selectedRoom.type || '').toLowerCase();
          const bookedType = (booking?.roomType || '').toLowerCase();
          const isMismatch = bookedType && selectedType && selectedType !== bookedType;
          return isMismatch ? (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-[13px] font-semibold text-amber-800">
                Room Type Mismatch
              </p>
              <p className="text-[12px] text-amber-700 mt-1">
                Guest booked <span className="font-semibold">{booking.roomType}</span> but selected room is{' '}
                <span className="font-semibold">{selectedRoom.room_type?.name || selectedRoom.type}</span>.
                This may result in a price difference. Proceed only if upgrading or with guest consent.
              </p>
            </div>
          ) : null;
        })()}

        {/* Selected Room Summary */}
        {selectedRoom && (
          <div className="p-3 bg-terra-50 border border-terra-200 rounded-lg">
            <p className="text-[13px] text-neutral-700">
              <span className="font-medium">Selected:</span>{' '}
              Room {selectedRoom.number || selectedRoom.roomNumber} - {selectedRoom.room_type?.name || selectedRoom.type}
              {selectedRoom.match_score && (
                <span className="ml-2 text-amber-600">(AI Score: {Math.round(selectedRoom.match_score)})</span>
              )}
            </p>
          </div>
        )}
      </div>
    </Drawer>
  );
}
