import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';
import { Button } from '../../ui2/Button';

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
                Email
                <input
                  name="email"
                  type="email"
                  value={formState.email}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex flex-col text-sm text-neutral-600 gap-2">
                Phone
                <input
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={handleChange}
                  className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
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
              Notes
              <textarea
                name="notes"
                value={formState.notes}
                onChange={handleChange}
                rows={3}
                className="bg-neutral-100 border border-neutral-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#A57865]"
              />
            </label>
          </form>
        </div>

          {/* Actions Footer - Sticky */}
          <div className="flex-shrink-0 bg-white border-t border-neutral-200 px-6 py-4 flex items-center justify-end gap-3 shadow-lg">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="edit-booking-form" disabled={!isFormValid || isSaving} icon={Save} loading={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
      </div>
    </>,
    document.body
  );
}
