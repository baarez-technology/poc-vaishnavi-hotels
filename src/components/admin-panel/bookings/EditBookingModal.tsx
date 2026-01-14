import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const SOURCE_OPTIONS = ['Website', 'Walk-in', 'Booking.com', 'Expedia'];

const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  return diff;
};

export default function EditBookingModal({ isOpen, booking, onClose, onSave, isSaving }) {
  const [formState, setFormState] = useState({
    guest: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    notes: '',
    source: 'Website',
  });

  useEffect(() => {
    if (booking && isOpen) {
      setFormState({
        guest: booking.guest || '',
        email: booking.email || '',
        phone: booking.phone || '',
        checkIn: booking.checkIn || '',
        checkOut: booking.checkOut || '',
        notes: booking.specialRequests || '',
        source: booking.source || 'Website',
      });
    }
  }, [booking, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setFormState((prev) => ({
        ...prev,
        notes: booking?.specialRequests || '',
      }));
    }
  }, [isOpen, booking]);

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

  const nights = useMemo(
    () => calculateNights(formState.checkIn, formState.checkOut),
    [formState.checkIn, formState.checkOut]
  );

  // Check if booking is confirmed or beyond - sensitive fields should be read-only
  const isBookingConfirmed = booking &&
    ['confirmed', 'checked_in', 'checked_out', 'completed', 'in_house', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'COMPLETED', 'IN_HOUSE'].includes(booking.status);

  const isFormValid =
    formState.guest.trim() &&
    formState.email.trim() &&
    formState.checkIn &&
    formState.checkOut &&
    nights > 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!booking || !isFormValid) return;

    // Parse guest name into first and last name
    const nameParts = formState.guest.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    onSave({
      // Guest info in format expected by API
      guestInfo: {
        firstName,
        lastName,
        email: formState.email.trim(),
        phone: formState.phone.trim(),
        country: booking.country || '',
        specialRequests: formState.notes.trim(),
      },
      // Booking details
      checkIn: formState.checkIn,
      checkOut: formState.checkOut,
      guests: {
        adults: booking.adults || 1,
        children: booking.children || 0,
      },
      specialRequests: formState.notes.trim(),
      // Also include flat format for backward compatibility
      guest: formState.guest.trim(),
      guestEmail: formState.email.trim(),
      guestPhone: formState.phone.trim(),
      nights,
      source: formState.source,
    });
  };

  if (!isOpen || !booking) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm z-[60]"
        onClick={onClose}
      />

      {/* Side Drawer */}
      <div
        className={`fixed top-0 bottom-0 right-0 h-screen w-full max-w-[650px] bg-white shadow-xl border-l border-neutral-200 z-[70] transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-neutral-900">
              Edit Booking
            </h2>
            <p className="text-sm text-neutral-600 mt-1">
              Update stay and guest details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#A57865]"
          >
            <X className="w-5 h-5 text-neutral-600 hover:text-neutral-900 transition-colors" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <form id="edit-booking-form" onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Notice for confirmed bookings */}
            {isBookingConfirmed && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-amber-800">Booking Confirmed</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Guest contact information (email, phone) and special requests cannot be modified after booking confirmation for security and audit purposes.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Guest Name
                <input
                  name="guest"
                  value={formState.guest}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
                />
              </label>
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Email {isBookingConfirmed && <span className="text-xs text-amber-600">(Read-only after confirmation)</span>}
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange}
                  readOnly={isBookingConfirmed}
                  className={`border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865] ${
                    isBookingConfirmed
                      ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-100'
                  }`}
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Phone {isBookingConfirmed && <span className="text-xs text-amber-600">(Read-only after confirmation)</span>}
                <input
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={handleChange}
                  readOnly={isBookingConfirmed}
                  className={`border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865] ${
                    isBookingConfirmed
                      ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                      : 'bg-neutral-100'
                  }`}
                />
              </label>
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Booking Source
                <select
                  name="source"
                  value={formState.source}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
                >
                  {SOURCE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Check-in
                <input
                  name="checkIn"
                  type="date"
                  value={formState.checkIn}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
                />
              </label>
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Check-out
                <input
                  name="checkOut"
                  type="date"
                  value={formState.checkOut}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
                />
              </label>
              <div className="flex flex-col text-sm text-neutral-600 gap-2">
                <span>Nights</span>
                <div className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                  {nights || 'TBD'}
                </div>
                {formState.checkIn &&
                  formState.checkOut &&
                  nights <= 0 && (
                    <p className="text-xs text-red-600">
                      Check-out must be after check-in.
                    </p>
                  )}
              </div>
            </div>

            <label className="flex flex-col text-sm text-neutral-600 gap-2">
              Special Requests / Notes {isBookingConfirmed && <span className="text-xs text-amber-600">(Read-only after confirmation)</span>}
              <textarea
                name="notes"
                value={formState.notes}
                onChange={handleChange}
                readOnly={isBookingConfirmed}
                rows={3}
                className={`border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865] ${
                  isBookingConfirmed
                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                    : 'bg-neutral-100'
                }`}
              />
            </label>
          </form>
        </div>

          {/* Actions Footer - Sticky */}
          <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 hover:shadow-sm text-neutral-700 hover:text-neutral-900 rounded-lg transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-booking-form"
              disabled={!isFormValid || isSaving}
              className="px-6 py-3 bg-[#A57865] hover:bg-[#8E6554] hover:shadow text-white disabled:bg-neutral-300 disabled:cursor-not-allowed rounded-lg transition-all duration-200 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A57865] focus:ring-offset-2 active:scale-95"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
      </div>
    </>,
    document.body
  );
}
