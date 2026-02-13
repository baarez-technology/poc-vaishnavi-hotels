/**
 * AssignGuestModal Component
 * Assign guest to room - Glimmora Design System v5.0
 * Side Drawer pattern using ui2/Drawer
 *
 * Fixes applied:
 * - BUG-012: Validates if guest already has a room assigned (shows warning popup)
 * - BUG-013: Persists assignment to backend via booking update
 * - BUG-016: Requires check-in/check-out dates for proper date-based assignment
 */

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bed, UsersRound, DollarSign, ChevronDown, Check, Search, Calendar, AlertTriangle } from 'lucide-react';
import { Drawer } from '../../ui2/Drawer';
import { Button } from '../../ui2/Button';
import { guestsService } from '../../../api/services/guests.service';
import { bookingService } from '../../../api/services/booking.service';
import { useToast } from '../../../contexts/ToastContext';

// Custom Select Dropdown Component with React Portal and Search
function GuestSelectDropdown({ value, onChange, options, placeholder, isLoading }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const displayLabel = selectedOption?.label || placeholder;

  // Filter options based on search query
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Estimate dropdown height
  const estimatedDropdownHeight = Math.min(filteredOptions.length * 44 + 56, 320);

  const calculatePosition = () => {
    if (!triggerRef.current) return null;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    const openAbove = spaceBelow < estimatedDropdownHeight && spaceAbove > spaceBelow;

    return {
      top: openAbove ? rect.top - estimatedDropdownHeight - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openAbove
    };
  };

  const handleToggle = () => {
    if (isLoading) return;
    if (isOpen) {
      setIsOpen(false);
      setPosition(null);
      setSearchQuery('');
    } else {
      setPosition(calculatePosition());
      setIsOpen(true);
      // Focus search input after opening
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  };

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setPosition(null);
    setSearchQuery('');
  };

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (!triggerRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) {
        setIsOpen(false);
        setPosition(null);
        setSearchQuery('');
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setPosition(null);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  // Update position on scroll/resize
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      setPosition(calculatePosition());
    };

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        className={`w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border transition-all flex items-center justify-between focus:outline-none ${
          isLoading
            ? 'border-neutral-200 bg-neutral-50 cursor-not-allowed'
            : isOpen
            ? 'border-terra-400 ring-2 ring-terra-500/10'
            : 'border-neutral-200 hover:border-neutral-300'
        }`}
      >
        <span className={`truncate ${value ? 'text-neutral-900' : 'text-neutral-400'}`}>
          {isLoading ? 'Loading guests...' : displayLabel}
        </span>
        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && position && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            maxHeight: `${estimatedDropdownHeight}px`,
            zIndex: 99999
          }}
          className={`bg-white rounded-lg border border-neutral-200 shadow-lg shadow-neutral-900/10 overflow-hidden animate-in fade-in-0 duration-100 ${
            position.openAbove ? 'origin-bottom' : 'origin-top'
          }`}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-neutral-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests..."
                className="w-full h-8 pl-9 pr-3 rounded-md text-[13px] bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-terra-400 focus:ring-1 focus:ring-terra-500/10 focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="py-1 max-h-52 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-3.5 py-3 text-[13px] text-neutral-400 text-center">
                No guests found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3.5 py-2.5 text-[13px] text-left hover:bg-neutral-50 transition-colors flex items-center justify-between ${
                    String(value) === String(option.value) ? 'bg-terra-50 text-terra-700 font-medium' : 'text-neutral-700'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{option.label}</span>
                    {option.email && (
                      <span className="text-[11px] text-neutral-400 truncate">{option.email}</span>
                    )}
                  </div>
                  {String(value) === String(option.value) && <Check className="w-4 h-4 text-terra-500 flex-shrink-0 ml-2" />}
                </button>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function AssignGuestModal({ room, isOpen, onClose, onAssign }) {
  const [selectedGuest, setSelectedGuest] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [availableGuests, setAvailableGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [isCheckingGuest, setIsCheckingGuest] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setSelectedGuest('');
      // Default check-in to today, check-out to tomorrow
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(today.toISOString().split('T')[0]);
      setCheckOutDate(tomorrow.toISOString().split('T')[0]);
      setExistingAssignment(null);
      setShowDuplicateWarning(false);
      fetchGuests();
    }
  }, [isOpen]);

  // BUG-012: Check if the selected guest already has an active room assignment
  useEffect(() => {
    if (!selectedGuest || !checkInDate || !checkOutDate) {
      setExistingAssignment(null);
      setShowDuplicateWarning(false);
      return;
    }
    checkGuestExistingAssignment();
  }, [selectedGuest, checkInDate, checkOutDate]);

  const checkGuestExistingAssignment = async () => {
    if (!selectedGuest) return;

    setIsCheckingGuest(true);
    try {
      // Fetch all bookings and check if this guest already has an active room for the date range
      const response = await bookingService.getBookings(1, 100);
      const bookings = response.items || (Array.isArray(response) ? response : []);

      const guest = availableGuests.find(g => String(g.id) === String(selectedGuest));
      if (!guest) return;

      const guestName = `${guest.first_name} ${guest.last_name}`.toLowerCase();
      const guestEmail = (guest.email || '').toLowerCase();

      // Find active bookings for this guest that overlap with selected dates
      const conflicting = bookings.find((b: any) => {
        const bookingGuest = (b.guestInfo?.firstName + ' ' + b.guestInfo?.lastName).toLowerCase();
        const bookingEmail = (b.guestInfo?.email || '').toLowerCase();
        const isMatchingGuest = bookingGuest === guestName || (guestEmail && bookingEmail === guestEmail);
        const isActive = b.status !== 'cancelled' && b.status !== 'checked-out';
        const hasRoom = b.room && b.room.number;

        // Check date overlap
        const bCheckIn = new Date(b.checkIn);
        const bCheckOut = new Date(b.checkOut);
        const selCheckIn = new Date(checkInDate);
        const selCheckOut = new Date(checkOutDate);
        const datesOverlap = bCheckIn < selCheckOut && bCheckOut > selCheckIn;

        return isMatchingGuest && isActive && hasRoom && datesOverlap;
      });

      if (conflicting) {
        setExistingAssignment(conflicting);
        setShowDuplicateWarning(true);
      } else {
        setExistingAssignment(null);
        setShowDuplicateWarning(false);
      }
    } catch (error) {
      console.error('[AssignGuestModal] Error checking guest assignment:', error);
    } finally {
      setIsCheckingGuest(false);
    }
  };

  const fetchGuests = async () => {
    try {
      setIsLoading(true);
      const guests = await guestsService.list({ pageSize: 100 });
      setAvailableGuests(guests || []);
    } catch (error) {
      console.error('[AssignGuestModal] Failed to fetch guests:', error);
      toast.error('Failed to load guests');
    } finally {
      setIsLoading(false);
    }
  };

  if (!room) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedGuest) {
      toast.warning('Please select a guest');
      return;
    }

    // BUG-016: Validate dates
    if (!checkInDate || !checkOutDate) {
      toast.warning('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkOutDate) <= new Date(checkInDate)) {
      toast.warning('Check-out date must be after check-in date');
      return;
    }

    // BUG-012: Block if guest already has an active room for these dates
    if (showDuplicateWarning && existingAssignment) {
      toast.error(`This guest is already assigned to Room ${existingAssignment.room?.number || existingAssignment.room?.name || 'N/A'} for overlapping dates. Please unassign them first.`);
      return;
    }

    const guest = availableGuests.find(g => String(g.id) === String(selectedGuest));
    if (guest) {
      onAssign(room.id, {
        id: guest.id,
        name: `${guest.first_name} ${guest.last_name}`,
        email: guest.email,
        phone: guest.phone,
        checkIn: checkInDate,
        checkOut: checkOutDate,
      });
      onClose();
      setSelectedGuest('');
    }
  };

  // Calculate nights
  const nights = checkInDate && checkOutDate
    ? Math.max(0, Math.floor((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const renderFooter = () => (
    <div className="flex items-center justify-end gap-3">
      <Button type="button" variant="ghost" onClick={onClose} className="px-5 py-2 text-[13px] font-semibold">
        Cancel
      </Button>
      <Button
        type="submit"
        variant="primary"
        form="assign-guest-form"
        disabled={showDuplicateWarning || !checkInDate || !checkOutDate || nights <= 0}
        className="px-5 py-2 text-[13px] font-semibold"
      >
        Assign Guest
      </Button>
    </div>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Guest"
      subtitle={`Room ${room.roomNumber} • ${room.type}`}
      maxWidth="max-w-2xl"
      footer={renderFooter()}
    >
      <form id="assign-guest-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Guest Selection */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Guest Selection
          </h4>
          <div>
            <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
              Select Guest
            </label>
            <GuestSelectDropdown
              value={selectedGuest}
              onChange={setSelectedGuest}
              options={availableGuests.map((guest) => ({
                value: guest.id,
                label: `${guest.first_name} ${guest.last_name}`,
                email: guest.email
              }))}
              placeholder="Select a guest"
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* BUG-012: Duplicate Assignment Warning */}
        {showDuplicateWarning && existingAssignment && (
          <div className="p-4 bg-rose-50 rounded-lg border border-rose-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] font-semibold text-rose-800">Guest Already Has Room Assigned</p>
                <p className="text-[12px] text-rose-700 mt-1">
                  This guest is currently assigned to <span className="font-semibold">Room {existingAssignment.room?.number || existingAssignment.room?.name || 'N/A'}</span>
                  {' '}(Booking: {existingAssignment.bookingNumber || existingAssignment.id})
                  {' '}from {existingAssignment.checkIn} to {existingAssignment.checkOut}.
                </p>
                <p className="text-[12px] text-rose-600 mt-1">
                  Please unassign the guest from their current room before making a new assignment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BUG-016: Check-in / Check-out Dates */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Stay Dates
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Check-in Date
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-neutral-500 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Check-out Date
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                min={checkInDate}
                className="w-full h-9 px-3.5 rounded-lg text-[13px] bg-white border border-neutral-200 hover:border-neutral-300 focus:border-terra-400 focus:ring-2 focus:ring-terra-500/10 focus:outline-none transition-all"
                required
              />
            </div>
          </div>
          {nights > 0 && (
            <p className="text-[11px] text-neutral-500 mt-2">
              {nights} night{nights !== 1 ? 's' : ''}
            </p>
          )}
          {checkInDate && checkOutDate && nights <= 0 && (
            <p className="text-[11px] text-rose-500 mt-2">
              Check-out date must be after check-in date
            </p>
          )}
        </div>

        {/* Room Details */}
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">
            Room Details
          </h4>
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-3">
            <div className="p-3 sm:p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <Bed className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Bed Type</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">{room.bedType}</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <UsersRound className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Capacity</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">{room.capacity} guests</p>
            </div>
            <div className="p-3 sm:p-4 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-neutral-400" />
                <span className="text-[11px] font-medium text-neutral-500">Price</span>
              </div>
              <p className="text-[13px] font-semibold text-neutral-900">${room.price}/night</p>
            </div>
          </div>
        </div>

        {/* Warning if room is not available */}
        {room.status !== 'available' && (
          <div className="p-4 bg-gold-50 rounded-lg border border-gold-100">
            <p className="text-[11px] font-semibold text-gold-700 mb-1">Warning</p>
            <p className="text-[13px] text-gold-600">
              This room is currently marked as "{room.status}". Assigning a guest will change the status to "occupied".
            </p>
          </div>
        )}
      </form>
    </Drawer>
  );
}
