import { useState, useEffect } from 'react';
import { X, UserPlus, Loader2, AlertTriangle, Calendar } from 'lucide-react';
import { guestsService, Guest } from '@/api/services/guests.service';
import { bookingService } from '@/api/services/booking.service';
import { Button } from '../../../ui2/Button';

export default function AssignGuestModal({ room, isOpen, onClose, onAssign, allBookings = [] }) {
  const [selectedGuest, setSelectedGuest] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedOutWarning, setCheckedOutWarning] = useState(false);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [autoFilledFromBooking, setAutoFilledFromBooking] = useState(false);

  // Fetch guests from API when modal opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSelectedGuest('');
      setCheckedOutWarning(false);
      setAutoFilledFromBooking(false);
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setCheckInDate(room?._prefilledCheckIn || today);
      setCheckOutDate(tomorrow.toISOString().split('T')[0]);

      const fetchGuests = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const guestList = await guestsService.list({ pageSize: 50 });
          setGuests(guestList);
        } catch (err: any) {
          console.error('[AssignGuestModal] Failed to fetch guests:', err);
          setError('Failed to load guests');
        } finally {
          setIsLoading(false);
        }
      };
      fetchGuests();
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Check if selected guest has only checked-out/cancelled bookings (no active ones)
  // Also auto-fill dates from active booking
  useEffect(() => {
    if (!selectedGuest) {
      setCheckedOutWarning(false);
      setAutoFilledFromBooking(false);
      return;
    }

    const guest = guests.find(g => String(g.id) === selectedGuest);
    if (!guest) return;

    const checkGuest = async () => {
      try {
        const response = await bookingService.getBookings(1, 100);
        const bookings = response.items || (Array.isArray(response) ? response : []);

        const guestId = guest.id;
        const guestName = `${guest.first_name} ${guest.last_name}`.toLowerCase().trim();
        const guestEmail = (guest.email || '').toLowerCase().trim();

        const allGuestBookings = bookings.filter((b: any) => {
          const matchById = b.guestId && Number(b.guestId) === Number(guestId);
          const bName = ((b.guestInfo?.firstName || '') + ' ' + (b.guestInfo?.lastName || '')).toLowerCase().trim();
          const bEmail = (b.guestInfo?.email || '').toLowerCase().trim();
          return matchById || (guestName && bName === guestName) || (guestEmail && bEmail && bEmail === guestEmail);
        });

        if (allGuestBookings.length > 0) {
          const hasActive = allGuestBookings.some((b: any) => {
            const s = (b.status || '').toLowerCase().replace('-', '_');
            return !['checked_out', 'cancelled', 'no_show'].includes(s);
          });
          setCheckedOutWarning(!hasActive);

          // Auto-fill dates from active booking
          if (hasActive) {
            const activeBooking = allGuestBookings.find((b: any) => {
              const s = (b.status || '').toLowerCase().replace('-', '_');
              return ['confirmed', 'booked', 'checked_in'].includes(s);
            });
            if (activeBooking) {
              const bCheckIn = activeBooking.checkIn || activeBooking.arrival_date;
              const bCheckOut = activeBooking.checkOut || activeBooking.departure_date;
              if (bCheckIn && bCheckOut) {
                setCheckInDate(bCheckIn.split('T')[0]);
                setCheckOutDate(bCheckOut.split('T')[0]);
                setAutoFilledFromBooking(true);
                return;
              }
            }
          }
        } else {
          setCheckedOutWarning(false);
        }
        setAutoFilledFromBooking(false);
      } catch (err) {
        console.error('[AssignGuestModal] Error checking guest bookings:', err);
      }
    };

    checkGuest();
  }, [selectedGuest, guests]);

  if (!isOpen || !room) return null;

  const nights = checkInDate && checkOutDate
    ? Math.max(0, Math.floor((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedGuest) {
      alert('Please select a guest');
      return;
    }

    if (checkedOutWarning) return;

    if (!checkInDate || !checkOutDate || nights <= 0) {
      alert('Please select valid check-in and check-out dates');
      return;
    }

    const guest = guests.find(g => String(g.id) === selectedGuest);
    if (guest) {
      setIsSubmitting(true);
      try {
        const guestName = `${guest.first_name} ${guest.last_name}`;
        await onAssign(room.id, {
          id: guest.id,
          name: guestName,
          email: guest.email,
          phone: guest.phone,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        });
        onClose();
        setSelectedGuest('');
      } catch (err) {
        // Error handled by parent
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Filter to active guests only
  const availableGuests = guests.filter(g => g.status !== 'blacklisted');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div>
            <h2 className="text-2xl font-serif font-semibold text-neutral-900">Assign Guest</h2>
            <p className="text-sm text-neutral-600 mt-1">
              Room {room.roomNumber} • {room.type}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors duration-150"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              Select Guest *
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-[#A57865]" />
                <span className="ml-2 text-sm text-neutral-600">Loading guests...</span>
              </div>
            ) : error ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            ) : (
              <select
                value={selectedGuest}
                onChange={(e) => setSelectedGuest(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#FAF8F6] border border-neutral-200 rounded-xl text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] transition-all duration-200"
              >
                <option value="">-- Select a guest --</option>
                {availableGuests.map(guest => (
                  <option key={guest.id} value={String(guest.id)}>
                    {guest.first_name} {guest.last_name} {guest.email ? `(${guest.email})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Checked-out guest warning */}
          {checkedOutWarning && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Guest has already checked out</p>
                  <p className="text-xs mt-1 text-red-700">
                    This guest has no active bookings. Please create a new booking from the Bookings page first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stay Dates */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-3">
              <Calendar className="w-3.5 h-3.5 inline mr-1" />
              Stay Dates *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Check-in</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => { setCheckInDate(e.target.value); setAutoFilledFromBooking(false); }}
                  min={new Date().toISOString().split('T')[0]}
                  disabled={autoFilledFromBooking}
                  className="w-full px-3 py-2 bg-[#FAF8F6] border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] disabled:opacity-60"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 mb-1">Check-out</label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => { setCheckOutDate(e.target.value); setAutoFilledFromBooking(false); }}
                  min={checkInDate}
                  disabled={autoFilledFromBooking}
                  className="w-full px-3 py-2 bg-[#FAF8F6] border border-neutral-200 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:border-[#A57865] disabled:opacity-60"
                />
              </div>
            </div>
            {nights > 0 && (
              <p className="text-xs text-neutral-500 mt-2">
                {nights} night{nights !== 1 ? 's' : ''}
                {autoFilledFromBooking && <span className="ml-2 text-green-600 font-medium">— Dates from booking</span>}
              </p>
            )}
            {checkInDate && checkOutDate && nights <= 0 && (
              <p className="text-xs text-red-500 mt-2">Check-out date must be after check-in date</p>
            )}
          </div>

          {/* Room Info */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs font-medium text-blue-900 mb-2">Room Details</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Bed Type:</span>
                <span className="font-medium text-blue-900">{room.bedType}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Capacity:</span>
                <span className="font-medium text-blue-900">{room.capacity} guests</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Price:</span>
                <span className="font-medium text-blue-900">₹{room.price}/night</span>
              </div>
            </div>
          </div>

          {/* Warning if room is not available */}
          {room.status !== 'available' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs font-medium text-amber-900 mb-1">Warning</p>
              <p className="text-xs text-amber-700">
                This room is currently marked as "{room.status}". Assigning a guest will change the status to "occupied".
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            icon={UserPlus}
            disabled={isSubmitting || checkedOutWarning || nights <= 0}
          >
            {isSubmitting ? 'Assigning...' : 'Assign Guest'}
          </Button>
        </div>
      </div>
    </div>
  );
}
